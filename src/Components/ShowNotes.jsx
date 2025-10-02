import React, { useEffect, useState } from "react";
import axios from "axios";
import { ProgressSpinner } from "primereact/progressspinner"; // ✅ Loader
import "./StyleCss/NotesShow.css"; // custom CSS file

const NotesModal = ({ isOpen, onClose, leadId, addedBy }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const APi_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isOpen) fetchNotes();
  }, [isOpen]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${APi_URL}/api/notes/filter`, {
        leadId,
        addedBy,
      });
      setNotes(res.data.data || []);
      console.log(res);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="notesShow-overlay">
      <div className="notesShow-modal">
        {/* Header */}
        <div className="notesShow-header">
          <h2 className="notesShow-title">Notes</h2>
          <button onClick={onClose} className="notesShow-closeBtn">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="notesShow-body">
          {loading ? (
            <div className="notesShow-loader">
              <ProgressSpinner style={{ width: "50px", height: "50px" }} strokeWidth="4" />
              <p>Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <p>No notes found.</p>
          ) : (
            <ul className="notesShow-list">
              {notes.map((note, idx) => (
                <li key={note._id}>
                  <p>
                    <strong>{notes.length - idx}.</strong> {note.NotesMessage}
                  </p>
                  <p className="notesShow-meta">
                    Added By: {note.addedBy?.name} | Date:{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                  {note.nextNotesDate && (
                    <p className="notesShow-next">
                      Next Note:{" "}
                      {new Date(note.nextNotesDate).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="notesShow-footer">
          <button onClick={onClose} className="notesShow-closeBtnFooter">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
