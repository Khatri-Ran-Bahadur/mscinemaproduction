
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  /* State for contact info */
  const [contactInfos, setContactInfos] = useState([
    {
      type: 'address',
      title: 'Visit Us',
      value: 'TK1 7-01, Terminal Kampar Putra,<br />31900 Kampar, Perak',
      icon: 'MapPin'
    },
    {
      type: 'phone',
      title: 'Call Us',
      value: '+60 12-345 6789<br /><span class="text-sm text-gray-500">Mon - Fri, 10am - 10pm</span>',
      icon: 'Phone'
    },
    {
       type: 'email',
       title: 'Email Us',
       value: 'admin@mscinemas.my<br /><span class="text-sm text-gray-500">We\'ll respond within 24 hours.</span>',
       icon: 'Mail'
    }
  ]);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const res = await fetch('/api/contact-info');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setContactInfos(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'MapPin': return <MapPin className="w-6 h-6" />;
      case 'Phone': return <Phone className="w-6 h-6" />;
      case 'Mail': return <Mail className="w-6 h-6" />;
      default: return <MapPin className="w-6 h-6" />;
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isHumanVerified) {
        alert('Please confirm you are not a robot.');
        return;
    }
    
    setStatus('submitting');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setIsHumanVerified(false);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error) {
       console.error(error);
       setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      <Header />
      
      <div className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#FFCA20] mb-4">Contact Us</h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Have questions or feedback? We'd love to hear from you. Fill out the form below or reach out via our direct channels.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Contact Info */}
            <div className="space-y-8">
               <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
               
               {contactInfos.slice(0, 2).map((info, index) => index>3 ?? (
                
                 <div key={index} className="flex items-start gap-4 p-6 bg-[#222] rounded-xl border border-white/5 hover:border-[#FFCA20]/50 transition-colors">
                   <div className="bg-[#FFCA20]/10 p-3 rounded-lg text-[#FFCA20]">
                      {getIcon(info.icon)}
                   </div>
                   <div>
                      <h3 className="font-semibold text-white mb-2">{info.title}</h3>
                      <div 
                        className="text-gray-400 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: info.value }}
                      />
                   </div>
                 </div>
               ))}
            </div>

            {/* Contact Form */}
            <div className="bg-[#222] p-8 rounded-2xl border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
              
              {status === 'success' ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center py-16">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                     <CheckCircle className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                   <p className="text-green-200">
                     Thank you for contacting us. We will get back to you shortly.
                   </p>
                   <button 
                     onClick={() => setStatus('idle')}
                     className="mt-6 text-[#FFCA20] hover:underline"
                   >
                     Send another message
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-400">Your Name</label>
                       <input 
                         type="text" 
                         name="name" 
                         value={formData.name}
                         onChange={handleChange}
                         required
                         className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none transition-all"
                         placeholder="John Doe"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-400">Phone Number</label>
                       <input 
                         type="tel" 
                         name="phone" 
                         value={formData.phone}
                         onChange={handleChange}
                         className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none transition-all"
                         placeholder="+60 12-345 6789"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-400">Email Address</label>
                     <input 
                       type="email" 
                       name="email" 
                       value={formData.email}
                       onChange={handleChange}
                       required
                       className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none transition-all"
                       placeholder="john@example.com"
                     />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-400">Subject</label>
                     <input 
                       type="text" 
                       name="subject" 
                       value={formData.subject}
                       onChange={handleChange}
                       required
                       className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none transition-all"
                       placeholder="How can we help?"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-400">Message</label>
                     <textarea 
                       name="message" 
                       value={formData.message}
                       onChange={handleChange}
                       required
                       rows={5}
                       className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none transition-all resize-none"
                       placeholder="Tell us more about your inquiry..."
                     />
                  </div>

                  <div className="flex items-center gap-3 bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                      <input 
                          type="checkbox" 
                          id="robotCheck"
                          checked={isHumanVerified}
                          onChange={(e) => setIsHumanVerified(e.target.checked)}
                          className="w-5 h-5 accent-[#FFCA20] cursor-pointer"
                      />
                      <label htmlFor="robotCheck" className="text-gray-300 cursor-pointer select-none">
                          I am not a robot
                      </label>
                  </div>
                  
                  {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>Failed to send message. Please try again later.</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'submitting'}
                    className="w-full bg-[#FFCA20] text-black font-bold text-lg py-4 rounded-lg hover:bg-[#ffda50] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Sending...
                       </>
                    ) : (
                       <>
                         Send Message
                         <Send className="w-5 h-5" />
                       </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Map Section */}
          {contactInfos.find(info => info.type === 'map_iframe') && (
              <div className="mt-16 bg-[#222] p-2 rounded-xl border border-white/5 overflow-hidden">
                  <div 
                      className="w-full h-[400px] rounded-lg overflow-hidden [&>iframe]:w-full [&>iframe]:h-full"
                      dangerouslySetInnerHTML={{ 
                          __html: contactInfos.find(info => info.type === 'map_iframe').value 
                      }}
                  />
              </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
