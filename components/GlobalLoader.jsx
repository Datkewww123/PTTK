'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'
import { fetchAddresses } from '@/lib/features/address/addressSlice'

export default function GlobalLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchAddresses())
  }, [dispatch])

  return null
}
