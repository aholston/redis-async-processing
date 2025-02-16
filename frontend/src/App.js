import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

function App() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("Not started");
  const [imageUrl, setImageUrl] = useState(null);

  const uploadImage = async () => {
    console.log("Here");
    const formData = new FormData();
    formData.append("image", file);

    console.log(formData)

    const response = await axios.post("http://localhost:5002/upload", formData);
    setJobId(response.data.jobId);
    setStatus("Processing...");
  };

  useEffect(() => {
    if (jobId) {
      const checkStatus = async () => {
        const res = await axios.get(`http://localhost:5002/status/${jobId}`);
        setStatus(res.data.status);
        if (res.data.status === "completed") {
          setImageUrl(res.data.imageUrl);
        }
      };

      const interval = setInterval(checkStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId]);

  useEffect(() => {
    socket.on("jobCompleted", (data) => {
      if (data.jobId === jobId) {
        setStatus("Completed!");
        setImageUrl(data.imageUrl);
      }
    });
  }, [jobId]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Image Upload & Processing</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadImage}>Upload</button>
      <p>Status: {status}</p>
      {imageUrl && <img src={`http://localhost:5002/${imageUrl}`} alt="Processed" />}
    </div>
  );
}

export default App;
