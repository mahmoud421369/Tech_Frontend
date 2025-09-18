
import React, { useState } from 'react';
import { RiUser2Line ,RiMailCheckFill,RiPhoneFill,RiMapPin2Line,RiPencilFill} from '@remixicon/react';
const EditProfile = ({darkMode}) => {
  const [formData, setFormData] = useState({
    username: 'mahmoud99',
    email: 'mahamoud@example.com',
    phone: '01102290039',
    address: 'Egypt, Cairo'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
   
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className={`container-fluid  ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-white to-indigo-50'}  mt-5 p-4 md:p-6`}>
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-500 flex items-center gap-4"><RiPencilFill size={18}/>Edit Profile</h2>
        <hr className='border-gray-200 dark:border-gray-900' /><br />
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex text-gray-400 items-center pointer-events-none">
                                  <RiUser2Line size={18}/>

                </div>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-10 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="username"
                />
              </div>
            </div>
            
             <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Email Address</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex text-gray-400 items-center pointer-events-none">
                                         <RiMailCheckFill size={18}/>
         
                         </div>
                         <input
                           name="email"
                           type="email"
                           required
                           value={formData.email}
                           onChange={handleChange}
                           className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-10 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="your-email@example.com"
                         />
                       </div>
                     </div>
          
            
       <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Phone Number</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex text-gray-400 items-center pointer-events-none">
                                         <RiPhoneFill size={18}/>
         
                         </div>
                         <input
                           name="phone_no"
                           type="text"
                           required
                           value={formData.phone}
                           onChange={handleChange}
                           className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-10 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="01192203304"
                         />
                       </div>
                     </div>
          </div>



          
          
          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Address
            </label>

                         <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 mb-10 flex text-gray-400 items-center pointer-events-none">
                                         <RiMapPin2Line size={18}/>
                         </div>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-10 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            ></textarea>
          </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {success && (
            <div className="mt-4 p-3 bg-emerald-100 text-emerald-700 rounded-md">
              Profile updated successfully!
            </div>
          )}
        </form>
        
      </div>
    </div>
  
  );
};

export default EditProfile;