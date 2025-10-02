import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ApplyInterviewModal = ({ isOpen, onClose, leadId, onSuccess }) => {
  const [interviewManagers, setInterviewManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const APi_URL = import.meta.env.VITE_API_URL;

  const callingTeamId = localStorage.getItem("CallingTeamId");

  useEffect(() => {
    if (isOpen) {
      fetchInterviewManagers();
    }
  }, [isOpen]);

  const fetchInterviewManagers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${APi_URL}/api/interview-manager/getAll`);
      setInterviewManagers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load interview managers');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedManager) {
      toast.error("Please select an Interview Manager!");
      return;
    }

    setApplying(true);
    try {
      await axios.post(`${APi_URL}/api/client-form/apply-interview`, {
        leadId: leadId,
        interviewManagerId: selectedManager,
        callingTeamId: callingTeamId,
      });

      toast.success("Interview Applied Successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error applying for interview");
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setSelectedManager("");
    setSearch("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Apply for Interview</h2>
        
        <div className="form-group">
          <label>Search Interview Manager:</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-box"
          />
        </div>

        <div className="form-group">
          <label>Select Interview Manager:</label>
          {loading ? (
            <div className="loading-text">Loading interview managers...</div>
          ) : (
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="dropdown"
            >
              <option value="">Select Interview Manager</option>
              {interviewManagers
                .filter((m) =>
                  m.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={handleClose}
            disabled={applying}
          >
            Cancel
          </button>
          <button 
            className="apply-btn" 
            onClick={handleApply}
            disabled={applying || !selectedManager}
          >
            {applying ? (
              <>
                <span className="button-spinner"></span>
                Applying...
              </>
            ) : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyInterviewModal;