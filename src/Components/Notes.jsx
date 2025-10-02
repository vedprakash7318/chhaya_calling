// src/components/ReminderModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressSpinner } from 'primereact/progressspinner'; 
import 'react-toastify/dist/ReactToastify.css';
import './StyleCss/Notes.css';

const ReminderModal = ({ isOpen, onClose, leadId, addedBy, addedByType }) => {
  const [message, setMessage] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [enableReminderDate, setEnableReminderDate] = useState(false);
  const [loading, setLoading] = useState(false); //
  const APi_URL = import.meta.env.VITE_API_URL;

  const handleSave = async () => {
    if (!message.trim()) {
      toast.warning('Please enter a message');
      return;
    }

    if (enableReminderDate && !reminderDateTime) {
      toast.warning('Please select a date & time');
      return;
    }

    const newReminder = {
      leadId,
      addedBy,
      addedByType,
      NotesMessage: message.trim(),
      nextNotesDate: enableReminderDate ? reminderDateTime : null,
    };

    try {
      setLoading(true); 
      await axios.post(`${APi_URL}/api/notes/add`, newReminder);
      toast.success('Reminder saved successfully!');

      setMessage('');
      setReminderDateTime('');
      setEnableReminderDate(false);
      onClose();
    } catch (error) {
      toast.error('Failed to save reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setReminderDateTime('');
    setEnableReminderDate(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="notes-modal-overlay">
      <div className="notes-modal-content">
        <div className="notes-modal-header">
          <h2 className="notes-modal-title">Set Reminder</h2>
          <button className="notes-close-btn" onClick={handleCancel}>
            ×
          </button>
        </div>

        {/* Message Input */}
        <div className="notes-form-group">
          <label htmlFor="message" className="notes-form-label">Message:</label>
          <textarea
            id="message"
            className="notes-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your reminder message..."
            rows="4"
          />
        </div>

        {/* Toggle for Date & Time */}
        <div className="notes-form-group flex items-center gap-2">
          <label className="notes-form-label">Add Date & Time:</label>
          <InputSwitch
            checked={enableReminderDate}
            onChange={(e) => setEnableReminderDate(e.value)}
          />
        </div>

        {/* Date & Time Input - only if switch is ON */}
        {enableReminderDate && (
          <div className="notes-form-group">
            <label htmlFor="datetime" className="notes-form-label">Date & Time:</label>
            <input
              type="datetime-local"
              id="datetime"
              className="notes-datetime-input"
              value={reminderDateTime}
              onChange={(e) => setReminderDateTime(e.target.value)}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="notes-modal-actions">
          <button className="notes-cancel-btn" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="notes-save-btn flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <ProgressSpinner
                  style={{ width: '20px', height: '20px' }}
                  strokeWidth="6"
                />
                Saving...
              </>
            ) : (
              'Save Reminder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
