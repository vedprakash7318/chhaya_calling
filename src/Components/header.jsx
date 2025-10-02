import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';  
import './StyleCss/header.css';

const Header = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef();
  const navigate = useNavigate();

  // ✅ Check if user logged in
  useEffect(() => {
    const callingId = localStorage.getItem("CallingTeamId");
    if (!callingId) {
      navigate("/");
    }
  }, [navigate]);

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Logout function with SweetAlert
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear(); // remove everything
        Swal.fire("Logged Out!", "You have been successfully logged out.", "success");
        navigate("/");   // redirect to login
      }
    });
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="admin-logo">
          <img src="public/logo.jpg" alt="logo" style={{ height: "30px", width: "100%" }} />
        </div>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="search-bar">
          <span className="Heading">Welcome Back Calling Team !!</span>
        </div>
      </div>

      <div className="navbar-right">
        <div
          className="user-profile"
          ref={profileRef}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaUserCircle className="user-avatar" />
          <span className="username">Admin</span>
          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-item">👤 Profile</div>
              <div className="dropdown-item" onClick={handleLogout}>🚪 Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
