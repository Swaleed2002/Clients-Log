import React from 'react';

export function Footer() {
  return (
    <footer className="text-center py-6 text-xs text-gray-400 font-medium">
      <p>&copy; {new Date().getFullYear()} Reliable Industrial Coding.<br/>All rights reserved.</p>
    </footer>
  );
}
