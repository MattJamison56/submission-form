"use client"
import { useState } from'react';

export default function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', file: null });

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: any) => {
    setFormData({
      ...formData,
      file: e.target.files[0],
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!formData.file) {
      alert('Please select a file to upload.');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('email', formData.email);
    formDataObj.append('file', formData.file);

    const res = await fetch('/api/submit', {
      method: 'POST',
      body: formDataObj,
    });

    if (res.ok) {
      alert('Submission successful!');
    } else {
      alert('Submission failed!');
    }
  };

  return (
    <div><h1>Submit Your Content</h1><form onSubmit={handleSubmit}><label>
          Name:
          <input type="text"name="name"value={formData.name}onChange={handleChange}required /></label><label>
          Email:
          <input type="email"name="email"value={formData.email}onChange={handleChange}required /></label><label>
          File:
          <input type="file"name="file"onChange={handleFileChange}required /></label><button type="submit">Submit</button></form></div>
  );
}
