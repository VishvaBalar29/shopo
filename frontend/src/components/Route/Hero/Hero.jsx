import React from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";

const Hero = () => {
  return (
    <div
      className={`relative min-h-[70vh] 800px:min-h-[80vh] w-full bg-no-repeat ${styles.noramlFlex}`}
      style={{
        backgroundImage:
          "url(https://themes.rslahmed.dev/rafcart/assets/images/banner-2.jpg)",
      }}
    >
      <div className={`${styles.section} w-[90%] 800px:w-[60%]`}>
        <h1
          className={`text-[35px] leading-[1.2] 800px:text-[60px] text-[#3d3a3a] font-[600] capitalize`}
        >
          Find Your All Needs<br /> At One Place
        </h1>
        <p className="pt-5 text-[19px] font-[Poppins] font-[600] text-[#000000ba]">

</p>
        <p className="pt-5 text-[16px] font-[Poppins] font-[400] text-[#000000ba]">
        Indulge in an unparalleled shopping experience with SHOPO. Discover a curated selection of premium products spanning across fashion, electronics, home essentials, beauty, and beyond. With our commitment to quality, convenience, and customer satisfaction, we're your ultimate destination for all your shopping needs. Shop with confidence knowing that every purchase is backed by our dedication to excellence and backed by seamless delivery to your doorstep. Join us in redefining the art of online shopping. Start exploring now and elevate your lifestyle with SHOPO.
        </p>
        <Link to="/products" className="inline-block">
            <div className={`${styles.button} mt-5`}>
                 <span className="text-[#fff] font-[Poppins] text-[18px]">
                    Shop Now
                 </span>
            </div>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
