"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Play, Check, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_BASE = "https://ar-hospital-backend-hqagfqdbbxguehdb.centralindia-01.azurewebsites.net"; // Replace with your production URL or use an env variable

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<any>(null);

  const fetchVideos = async () => {
    try {
      // If developing locally, change this to localhost:8080
      const res = await fetch(`${API_BASE}/api/admin/videos`); 
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (e) {
      console.error('Failed to fetch videos', e);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading video ${i + 1} of ${files.length} (${file.name})...`);

      const formData = new FormData();
      formData.append('video', file);

      try {
        const res = await fetch(`${API_BASE}/api/upload-video`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          failCount++;
          console.error('Upload failed for', file.name, data.error);
        }
      } catch (err) {
        failCount++;
        console.error('Upload error for', file.name, err);
      }
    }

    setUploadProgress(`Finished. ${successCount} successful, ${failCount} failed.`);
    fetchVideos();
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress('');
      if (e.target) e.target.value = null;
    }, 4000);
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await fetch(`${API_BASE}/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IsActive: !currentStatus })
      });
      fetchVideos();
    } catch (e) { console.error(e); }
  };

  const updateOrder = async (id, currentOrder, delta) => {
    try {
      await fetch(`${API_BASE}/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DisplayOrder: currentOrder + delta })
      });
      fetchVideos();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = (vid: any) => {
    setVideoToDelete(vid);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!videoToDelete) return;
    setDeleteModalOpen(false);
    try {
      await fetch(`${API_BASE}/api/videos/${videoToDelete.Id}`, {
        method: 'DELETE'
      });
      fetchVideos();
    } catch (e) { console.error(e); }
    setVideoToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Video Signage Management</h1>
          </div>
          <div>
            <label className={`cursor-pointer px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Upload Video'}
              <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFileUpload} disabled={isUploading} multiple />
            </label>
            {uploadProgress && <div className="text-sm mt-2 font-semibold text-teal-600">{uploadProgress}</div>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-4 rounded-tl-lg font-semibold">Preview</th>
                <th className="p-4 font-semibold">Video Name</th>
                <th className="p-4 font-semibold text-center">Display Order</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold">Date Uploaded</th>
                <th className="p-4 rounded-tr-lg font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((vid) => (
                <tr key={vid.Id} className={`border-b last:border-0 hover:bg-slate-50 transition-colors ${!vid.IsActive ? 'opacity-50 bg-slate-50' : ''}`}>
                  <td className="p-4 w-40">
                    <video src={vid.VideoUrl} className="w-full h-20 object-cover rounded bg-black" autoPlay loop muted playsInline />
                  </td>
                  <td className="p-4 max-w-[200px] truncate" title={vid.VideoName}>{vid.VideoName}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => updateOrder(vid.Id, vid.DisplayOrder, -1)} className="p-1 bg-slate-200 rounded hover:bg-slate-300">-</button>
                      <span className="font-semibold w-6 text-center">{vid.DisplayOrder}</span>
                      <button onClick={() => updateOrder(vid.Id, vid.DisplayOrder, 1)} className="p-1 bg-slate-200 rounded hover:bg-slate-300">+</button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => toggleActive(vid.Id, vid.IsActive)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${vid.IsActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {vid.IsActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(vid.CreatedDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => confirmDelete(vid)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No videos uploaded yet. Click Upload Video to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 scale-100 transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Video?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to permanently delete <strong className="break-all">{videoToDelete?.VideoName}</strong> from Azure Storage and the database? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
