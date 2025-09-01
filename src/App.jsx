import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Pages/CallingTeam/Login';
import Leads from './Pages/CallingTeam/Leads';
import Dashboard from './Pages/CallingTeam/Dashboard'
import ClientForm from './Pages/CallingTeam/ClientForm';
import Mainpage from './Pages/CallingTeam/Mainpage';
import PassportHolder from './Pages/CallingTeam/PassportHolder';
import ViewClientForm from './Pages/CallingTeam/ViewClientForm';
import PaymentBook from './Pages/CallingTeam/PaymentBook';
function App() {

  return (
    <>
      <Router>
         <Routes>
        <Route path='/' element={<Login/>}/>




          <Route path="/Leads" element={
          <Dashboard>
            <Leads />
          </Dashboard>
        } />
          <Route path="/passport-holder" element={
          <Dashboard>
            <PassportHolder />
          </Dashboard>
        } />

          <Route path="/dashboard" element={
          <Dashboard>
            <Mainpage />
          </Dashboard>
        } />

          <Route path="/form" element={
          <Dashboard>
            <ClientForm />
          </Dashboard>
        } />

          <Route path="/view-form" element={
          <Dashboard>
            <ViewClientForm />
          </Dashboard>
        } />

          <Route path="/payment-book" element={
          <Dashboard>
            <PaymentBook />
          </Dashboard>
        } />

         </Routes>
    </Router>
    </>
  )
}

export default App
