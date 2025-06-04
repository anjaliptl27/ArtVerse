import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { TrashIcon, MinusIcon, PlusIcon, HeartIcon } from '@heroicons/react/24/solid';

interface CartItem {
  _id: string;
  itemId: string;
  itemType: 'artwork' | 'course';
  title: string;
  price: number;
  thumbnail?: string;
  images?: Array<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
  }>;
  quantity: number;
  artistId?: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  stats?: {
    views: number;
    likes: number;
  };
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/cart`, {
          withCredentials: true
        });

        if (response.data.success) {
          const items = response.data.data?.items || response.data.items || [];
          const processedItems = items.map((item: CartItem) => ({
            ...item,
            thumbnail: item.images?.[0]?.url || '/default-artwork.png'
          }));
          setCartItems(processedItems);
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          toast.error('Please login to view cart');
          navigate('/login');
        } else {
          toast.error('Failed to load cart');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [navigate]);

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        { withCredentials: true }
      );
      
      setCartItems(prev => 
        prev.map(item => 
          item._id === cartItemId 
            ? { ...item, quantity: newQuantity } 
            : item
        )
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      toast.error(axiosError.response?.status || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/cart/${cartItemId}`,
        { withCredentials: true }
      );
      
      setCartItems(prev => prev.filter(item => item._id !== cartItemId));
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove from cart');
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/cart`, {
        withCredentials: true
      });
      
      setCartItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessingPayment(true);
      
      const orderItems = cartItems.map(item => ({
        itemId: item.itemId,
        itemType: item.itemType,
        quantity: item.quantity,
        price: item.price
      }));

      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/orders`, {
        items: orderItems
      }, {
        withCredentials: true
      });
      
      await clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      const axiosError = error as AxiosError;
      toast.error(axiosError.response?.status|| 'Checkout failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const navigateToItem = (item: CartItem) => {
  if (!item.itemId) {
    console.error('Missing itemId:', item);
    toast.error('Cannot navigate to item - missing ID');
    return;
  }
  navigate(`/${item.itemType === 'artwork' ? 'artworks' : 'courses'}/${item.itemId}`);
};

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl">Your cart is empty</p>
          <button 
            onClick={() => navigate('/artworks')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Browse Artworks
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            {cartItems.map((item) => (
             // In your JSX for each cart item:
<div 
  key={item._id} 
  className="border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition cursor-pointer"
  onClick={() => navigateToItem(item)}
>
  <div className="w-full sm:w-32 h-32 bg-gray-100 rounded overflow-hidden">
    <img
      src={item.thumbnail}
      alt={item.title}
      className="w-full h-full object-cover"
      onClick={(e) => {
        e.stopPropagation();
        navigateToItem(item);
      }}
    />
  </div>
  <div className="flex-grow">
    <h3 
      className="text-lg font-semibold hover:text-blue-500"
      onClick={(e) => {
        e.stopPropagation();
        navigateToItem(item);
      }}
    >
      {item.title}
    </h3>
                  {item.artistId && (
                    <p className="text-sm text-gray-600">
                      by {item.artistId.profile.name}
                    </p>
                  )}
                  <p className="text-gray-600 mt-1">₹{item.price.toFixed(2)}</p>
                  <div className="flex items-center mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item._id, item.quantity - 1);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="mx-3">{item.quantity}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item._id, item.quantity + 1);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item._id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={clearCart}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Entire Cart
            </button>
          </div>
          
          <div className="lg:w-1/3">
            <div className="border rounded-lg p-6 bg-gray-50 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t my-4"></div>
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={processingPayment || cartItems.length === 0}
                className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {processingPayment ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <button
                onClick={() => navigate('/wishlist')}
                className="w-full mt-4 py-2 text-blue-500 hover:underline flex items-center justify-center gap-1"
              >
                <HeartIcon className="h-5 w-5" />
                View Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;