import AdminHeader from '../components/Layout/AdminHeader'
import AdminSideBar from '../components/Admin/Layout/AdminSideBar'
import { React, useState } from "react";
import axios from "axios";
import {server} from "../server";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/styles";

const AddCategory = () => {

    const navigate = useNavigate();
    const [category, setCategory] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(category);
        await axios
            .post(
                `${server}/product/add-category`,
                {
                    category
                },
                { withCredentials: true }
            )
            .then((res) => {
                console.log(res);
                toast.success("Category added successfully!");
                setCategory("");
            })
            .catch((err) => {
                toast.error(err.response.data.message);
                console.log(err);
            });
    };
    return (
        <div>
            <AdminHeader />
            <div className="w-full flex">
                <div className="flex items-start justify-between w-full">
                    <div className="w-[80px] 800px:w-[330px]">
                        <AdminSideBar active={9} />
                    </div>
                    <div className="flex items-start justify-between w-full mt-5 pt-5">
                        <div className="w-[80px] 800px:w-[330px] mx-auto mt-5 pt-5  ps-5 pe-5 pb-5"  style={{"backgroundColor":"white"}}>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Category Title : 
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="category"
                                            name="category"
                                            autoComplete="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                        
                                    </div>
                                </div>                               
                                <div>
                                    <button
                                        type="submit"
                                        className=" mx-auto group relative w-[180px] h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddCategory