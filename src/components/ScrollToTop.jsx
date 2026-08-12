import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      // Use instant scroll behavior to prevent CSS smooth-scroll animations from stopping mid-way
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    // Immediate scroll reset
    resetScroll();

    // Secondary resets across animation frames and timeout to account for React re-renders and dynamic content loading
    const rafId = requestAnimationFrame(resetScroll);
    const timerId = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default ScrollToTop;
