import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id: string | null | undefined;
  nombres: string | null | undefined;
  apellidos: string | null | undefined;
  backendTokens: {
    accessToken: string | null | undefined,
  } | null| undefined;
}

const initialState: UserState = {
  id: null,
  nombres: null,
  apellidos: null,
  backendTokens: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.id = action.payload.id;
      state.nombres = action.payload.nombres;
      state.apellidos = action.payload.apellidos;
      state.backendTokens = action.payload.backendTokens;
    },
    clearUser: (state) => {
      state.id = null;
      state.nombres = null;
      state.apellidos = null;
      state.backendTokens = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;