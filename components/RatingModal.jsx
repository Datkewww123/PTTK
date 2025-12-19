'use client'

import { Star } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice';
import { fetchProducts } from '@/lib/features/product/productSlice';

const RatingModal = ({ ratingModal, setRatingModal }) => {
    const{getToken} = useAuth();
    const dispatch = useDispatch()
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyRated, setAlreadyRated] = useState(false);

    // Check if this product/order is already rated by this user
    useEffect(() => {
        let mounted = true;
        const checkRated = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`/api/rating?productId=${ratingModal.productId}&orderId=${ratingModal.orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!mounted) return;
                if (data.exists) {
                    setAlreadyRated(true);
                    setRating(data.rating.rating);
                    setReview(data.rating.review || '');
                }
            } catch (err) {
                // ignore
            }
        }
        if (ratingModal?.productId && ratingModal?.orderId) checkRated();
        return () => { mounted = false }
    }, [ratingModal]);

    const handleSubmit = async () => {
        if (alreadyRated) {
            return toast('You have already rated this product')
        }
        if (rating < 1 || rating > 5) {
            return toast('Please select a rating');
        }
        if (review.length < 5) {
            return toast('Please write a short review (min 5 chars)');
        }
        setSubmitting(true);
        try {

  const token = await getToken();
  const { data } = await axios.post('/api/rating', {
    productId: ratingModal.productId, 
    orderId: ratingModal.orderId, 
    rating, 
    review
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  dispatch(addRating(data.rating || { productId: ratingModal.productId, rating, review }));
  // refresh product list so UI reflects new average ratings
  try { dispatch(fetchProducts()) } catch (e) { /* ignore*/ }
  toast.success(data.message || 'Rating added');
  setRatingModal(null);

} catch (error) {
  const errMsg = error?.response?.data?.error || error.message;
  if (errMsg.includes('already')) {
    setAlreadyRated(true);
  }
  toast.error(errMsg);
} finally {
  setSubmitting(false);
}
    }

    return (
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-4'>Rate Product</h2>
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 ${alreadyRated ? 'cursor-default' : 'cursor-pointer'} ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => !alreadyRated && setRating(i + 1)}
                        />
                    ))}
                </div>
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    placeholder='Write your review (optional)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button onClick={e => toast.promise(handleSubmit(), { loading: 'Submitting...' })} disabled={submitting || alreadyRated} className={`w-full py-2 rounded-md transition ${submitting || alreadyRated ? 'bg-slate-300 text-slate-500' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                    {alreadyRated ? 'Already rated' : submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal