import { Outlet } from "react-router";
import { useEffect } from "react";

export default function Root() {
  useEffect(() => {
    // Handle non-hash URLs and redirect to hash URLs
    // This ensures links like /u/username work as /#/u/username
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // If there's a path but no hash (or hash is just #/), redirect to hash version
    if (path && path !== '/' && (!hash || hash === '#' || hash === '#/')) {
      // Remove leading slash and add to hash
      const newHash = '#' + path + window.location.search;
      window.location.replace(window.location.origin + '/' + newHash);
    }
  }, []);

  return (
    <div className="size-full">
      <Outlet />
    </div>
  );
}