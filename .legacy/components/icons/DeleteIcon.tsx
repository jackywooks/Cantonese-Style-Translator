
import React from 'react';

const DeleteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L11 5.79M11 5.79L11 4.5a2.25 2.25 0 012.25-2.25h.097c.536 0 .989.377 1.151.886L14.74 9M4.772 5.79c-.269.16-.514.338-.738.53L3 7.5M7.5 3c.096.03.19.064.282.1M7.5 3L7.5 4.5M7.5 3H5.25A2.25 2.25 0 003 5.25v1.5c0 .146.03.288.084.416M3 7.5L3 9m0 0V6.375m0 2.625v1.5c0 .966.784 1.75 1.75 1.75h10.5c.966 0 1.75-.784 1.75-1.75v-1.5m0 0V6.375m0 2.625L19.5 9.75M19.5 9.75L21 7.5M19.5 9.75H3" />
  </svg>
);

export default DeleteIcon;
