import { useContext } from 'react';
import { WishlistContext } from '@/store/contexts/wishlistContext';

export const useWishlist = () => useContext(WishlistContext);

export default useWishlist;
