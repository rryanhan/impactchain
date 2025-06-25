import { Link } from "react-router-dom";

const ImpactChainStepperSidebar = ({ onBack }) => (
  <div className="w-full max-w-md px-10 py-12 bg-gray-50 border-r border-gray-200 min-h-[80vh] flex flex-col">
    {/* Go Back */}
    <Link to="/" className="mb-4">
      <span className="text-primary text-lg font-semibold hover:underline cursor-pointer">
        &larr;
      </span>
    </Link>

    {/* Title */}
    <div>
      <h2 className="text-2xl font-semibold mb-1">Start an</h2>
      <div className="flex items-center mb-4">
        <span className="text-4xl font-extrabold text-gray-400 mr-2">Impact</span>
        {/* Logo underline accent effect */}
        <span className="relative">
          <span className="text-4xl font-extrabold text-green-500">Chain</span>
          {/* Optionally add a line/arrow SVG for accent */}
        </span>
      </div>
    </div>

    {/* Help Text */}
    <p className="mb-5 text-gray-700">
      Here’s how to build trust and get the most support for your campaign.
    </p>

    {/* Why a Separate Charity Wallet */}
    <div className="mb-4">
      <div className="font-semibold mb-2">
        <span className="bg-green-100 rounded px-1">Why a Separate Charity Wallet?</span>
      </div>
      <ul className="list-disc list-inside text-gray-700 text-sm mb-2">
        <li>
          <span className="font-medium text-green-700">You are the Creator:</span> Your connected wallet gives you the power to create this campaign and post impact updates.
        </li>
        <li>
          <span className="font-medium text-green-700">They are the Beneficiary:</span> The “Charity Wallet Address” you enter is the only address that can ever receive the donated funds.
        </li>
      </ul>
      <p className="text-xs text-gray-500 italic">
        This separation is our promise to donors. They don’t have to trust an individual person; they can verify on the blockchain that their donation is locked for the intended cause.
      </p>
      <p className="text-xs text-gray-500 italic mt-1">
        <span className="font-semibold">Of course,</span> if this campaign is for a personal cause (like medical bills or a creative project), you should enter your own wallet address as the beneficiary. The key is that this destination is transparent and locked from the start.
      </p>
    </div>

    {/* Tips for a Great Campaign */}
    <div className="mb-6">
      <div className="font-semibold mb-2">
        <span className="bg-green-100 rounded px-1">Tips for a Great Campaign</span>
      </div>
      <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
        <li><span className="font-medium text-green-700">Use real photos:</span> Show donors the people and places they’ll be helping.</li>
        <li><span className="font-medium text-green-700">Tell a clear story:</span> Explain the problem and how their contribution will directly create a solution.</li>
        <li><span className="font-medium text-green-700">Be specific:</span> Talk about how you’ll use the funds. Donors appreciate knowing exactly where their contributions are making an impact.</li>
      </ul>
    </div>

    {/* Buttons */}
    <div className="flex space-x-4 mt-auto">
      <button className="bg-gray-200 rounded px-5 py-2 font-medium text-gray-800 hover:bg-gray-300">Preview</button>
      <button className="bg-green-400 rounded px-5 py-2 font-bold text-black hover:bg-green-500">Lock It In!</button>
    </div>
  </div>
);

export default ImpactChainStepperSidebar;