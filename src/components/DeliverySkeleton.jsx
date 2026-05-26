import React from "react";

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
  
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-pulse">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-lime-200 dark:bg-lime-900/50" />
              <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
            <div className="w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="w-80 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
          <div className="w-48 h-16 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm" />
        </div>

    
    
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 space-y-6 animate-pulse"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50">
                <div className="w-28 h-3 bg-gray-100 dark:bg-gray-700 rounded-md" />
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>

       
       
        <div className="grid lg:grid-cols-3 gap-8">
          
          
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                </div>
              </div>
              <div className="w-24 h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
            </div>

            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] border border-gray-50 dark:border-gray-700/50">
                  <div className="flex items-center gap-4 w-2/3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      <div className="w-3/4 h-3 bg-gray-150 dark:bg-gray-700/80 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2 w-16 text-right">
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded-md ml-auto" />
                    <div className="w-8 h-2 bg-gray-150 dark:bg-gray-700/80 rounded-sm ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          
          <div className="space-y-6">
           
           
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 space-y-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-2">
                    <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="w-28 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-250 dark:bg-gray-700/50 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="w-full h-3 bg-gray-150 dark:bg-gray-700/80 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

           
           
            <div className="h-64 bg-lime-100 dark:bg-lime-950/20 rounded-[2.5rem] border border-lime-200 dark:border-lime-900/50 p-8 space-y-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ title = "Orders" }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
       
       
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-pulse">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-lime-200 dark:bg-lime-900/50" />
              <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
            <div className="w-72 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="w-96 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
          <div className="w-52 h-16 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm" />
        </div>

      
      
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="w-full lg:w-2/3 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
            <div className="w-48 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl ml-auto" />
          </div>
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-8 py-6">
                      <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    
                    
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="w-16 h-3 bg-gray-150 dark:bg-gray-700/80 rounded-sm" />
                      </div>
                    </td>
                  
                  
                    <td className="px-8 py-6">
                      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-mono" />
                    </td>
                    
                    
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2">
                          <div className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                          <div className="w-16 h-3 bg-gray-150 dark:bg-gray-700/80 rounded-sm" />
                        </div>
                      </div>
                    </td>
                    
                    
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                          <div className="w-16 h-3 bg-gray-150 dark:bg-gray-700/80 rounded-sm" />
                        </div>
                      </div>
                    </td>
                    
                    
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="w-12 h-3 bg-lime-200 dark:bg-lime-900/40 rounded-sm" />
                      </div>
                    </td>
                  
                  
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 rounded-2xl" />
                        <div className="w-24 h-12 bg-lime-200 dark:bg-lime-950/20 rounded-2xl" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 animate-pulse">
        
        
        <div className="relative bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="text-center md:text-left flex-1 space-y-3">
              <div className="flex justify-center md:justify-start gap-2">
                <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
                <div className="w-16 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto md:mx-0" />
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-md mx-auto md:mx-0" />
              <div className="w-36 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto md:mx-0 pt-2" />
            </div>
          </div>
        </div>

       
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/20 dark:shadow-none space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="w-44 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl">
                  <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-2 flex-1">
                    <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  <div className="w-full h-12 bg-gray-100 dark:bg-gray-700/50 rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
