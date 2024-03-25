import { React, useState } from "react";
import styles from "../styles/styles";
import { Link, useNavigate , useParams} from "react-router-dom";
import { server } from "../server";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPass = () => {
  const navigate = useNavigate(); 
  const [password,setPassword] = useState('');
  const [passwordError, setPasswordError] = useState("");
  const [visible, setVisible] = useState(false);
  const {id, token} = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;
    if (!password.trim()) {
        setPasswordError("Password is required");
        isValid = false;
      } 
      else if (!/(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{6,}/.test(password)) {
        setPasswordError("Password must contain at least one digit, one special character, and one letter, and be at least 6 characters long");
        isValid = false;
      } 
      else {
        setPasswordError("");
      }
      if(isValid == true){
        try {
            const response = await fetch(`${server}/user/reset-password/${id}/${token}`,{
                method:"POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({password}),
            })
            console.log("reset-password page",response);
            if(response.ok){
                setPassword("");
                navigate("/login");
            }
        } catch (error) {
            console.log(`error from reset-password page : ${error}`);
        }
      }
    
    }
    

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={visible ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                {visible ? (
                  <AiOutlineEye
                    className="absolute right-2 top-2 cursor-pointer"
                    size={25}
                    onClick={() => setVisible(false)}
                  />
                ) : (
                  <AiOutlineEyeInvisible
                    className="absolute right-2 top-2 cursor-pointer"
                    size={25}
                    onClick={() => setVisible(true)}
                  />
                )}
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
            <div className={`${styles.noramlFlex} w-full`}>
              <h4>Not have any account?</h4>
              <Link to="/sign-up" className="text-blue-600 pl-2">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPass;