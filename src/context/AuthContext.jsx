import { createContext, useState } from "react";

export const AuthContext = createContext()

export default function AuthProvider({children}) {
   const [userToken , setUserToken ] = useState(
    ()=> localStorage.getItem("User_Token")
   );

   function saveUserToken(token) {
    setUserToken(token)
    localStorage.setItem("User_Token", token)
    
   }
   function removeUserToken (){
    setUserToken(null)
    localStorage.removeItem("User_Token")
   }
   console.log(userToken);
   
  return (
    <AuthContext.Provider value={{ userToken, saveUserToken, removeUserToken }}>
         {children}
    </AuthContext.Provider>
  )
}
