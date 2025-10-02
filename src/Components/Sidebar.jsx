import React from 'react';
import './StyleCss/Sidebar.css';
import {
  FaHome,
  FaUserFriends,
  FaPassport,
  FaWpforms,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { icon: <FaHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FaUserFriends />, label: 'Leads', path: '/leads' },
    { icon: <FaPassport />, label: 'Passport Holder', path: '/passport-holder' },
    { icon: <FaWpforms />, label: 'Filled Form', path: '/filled-form' },
  ];

  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <ul>
        {menu.map((item, i) => (
          <li
            key={i}
            onClick={() => handleClick(item.path)}
            className={location.pathname === item.path ? 'active' : ''}
          >
            <span className="admin-icon">{item.icon}</span>
            <span className="admin-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
