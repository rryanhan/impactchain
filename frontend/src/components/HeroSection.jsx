import ConnectWalletButton from "./ConnectWalletButton";
function HeroSection() {
  return (
    <section className="
      bg-gray-100 items-center justify-between  
      rounded-3xl 
      flex flex-row
      p-20 
      gap-16
    ">
      {/* Left Text Content */}
      <div className="flex-1 text-center text-left">
        {/* Using a default green to test if any color classes are working */}
        <h2 className="
          isolate
          text-6xl font-bold leading-tight 
          mb-6 
        ">
          You're this close to <span className="
            bg-green-500
            bg-round-full
          ">real</span> impact in your community
        </h2>
        {/* Using a default green to test text color */}
        <p className="text-lg md:text-xl text-black mb-10 max-w-lg md:max-w-none mx-auto md:mx-0">
          Crowdfunding made transparent and honest with blockchain technologies.
        </p>
        
        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
          <ConnectWalletButton />
          <button className="
            bg-gray-200
            font-bold 
            py-3 px-8 rounded-sm 
            text-lg shadow-lg hover:shadow-xl hover:bg-green-50
            transition duration-300 ease-in-out transform hover:scale-105
          ">
            Explore ImpactChains
          </button>
        </div>
      </div>

      {/* Right Illustration */}
      <div className="flex-1 flex justify-center md:justify-end">
        <img 
          src="./src/assets/impact-illustration.png"
          alt="Hand holding blockchain chain" 
          className="max-w-xs md:max-w-sm lg:max-w-md w-full h-auto"
        />
      </div>
    </section>
  );
}
export default HeroSection;