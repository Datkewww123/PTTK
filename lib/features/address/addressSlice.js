import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async (_, thunkAPI) => {
    try {
        const res = await axios.get('/api/address')
        return res.data.addAddress || res.data.addresses || []
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message)
    }
})

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [],
        loading: false,
        error: null
    },
    reducers: {
        addAddress: (state, action) => {
            state.list.push(action.payload)
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAddresses.pending, (state) => { state.loading = true; state.error = null })
            .addCase(fetchAddresses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload })
            .addCase(fetchAddresses.rejected, (state, action) => { state.loading = false; state.error = action.payload })
    }
})

export const { addAddress } = addressSlice.actions

export default addressSlice.reducer