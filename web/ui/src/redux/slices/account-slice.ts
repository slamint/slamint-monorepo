import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface Profile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department?: {
    id: string;
    code: string;
    name: string;
  };
  reportingManager?: {
    id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'locked';
  createdAt: string;
  updatedAt: string;
  firstLoginAt: string;
  lastLoginAt: string;
}

export interface AccountState {
  profile: Profile | null;
}

const initialState: AccountState = { profile: null };

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setProfileData: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    resetProfileData: (state) => {
      state.profile = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setProfileData, resetProfileData } = accountSlice.actions;

export const accountReducer = accountSlice.reducer;
