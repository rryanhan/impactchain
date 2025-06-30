import React, { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage"; // We'll define this helper below
import { Stepper, Step, Button } from "@material-tailwind/react";
import { useAccount } from "wagmi";
import { BrowserProvider, Contract, parseUnits } from "ethers";

import { pinataUpload } from "../pinataUpload";
import ImpactChainFactoryABI from "../abi/ImpactChainFactory.json";

// Define your steps here
const STEPS = [
  "Name",
  "Funding Type",
  "Wallet Address",
  "Title",
  "Description",
  "Funding Goal",
  "Images"
];




export default function ImpactChainStepperForm() {

    const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
const [showCropper, setShowCropper] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);
const [croppedImage, setCroppedImage] = useState(null);
  const { address: userAddress, isConnected } = useAccount();
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [form, setForm] = useState({
    name: "",
    fundingType: "",
    wallet: "",
    title: "",
    description: "",
    fundingGoal: "",
    images: [],
  });
  const [orgWalletInput, setOrgWalletInput] = useState("");
  const [useCustomWallet, setUseCustomWallet] = useState(false);

  // Refs for focusing on inputs after tab change
  const inputRef = useRef(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
  setCroppedAreaPixels(croppedAreaPixels);
}, []);

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedImage(URL.createObjectURL(file));
    setShowCropper(true);
    setForm(f => ({ ...f, images: [file] }));
  }
};

const handleCropSave = async () => {
  const cropped = await getCroppedImg(selectedImage, croppedAreaPixels, 600, 400);
  setCroppedImage(cropped);
  setShowCropper(false);
  // Convert cropped blob to File for upload
  const croppedFile = new File([cropped], "cropped-image.jpg", { type: "image/jpeg" });
  setForm(f => ({ ...f, images: [croppedFile] }));
};

const handleCropCancel = () => {
  setShowCropper(false);
  setSelectedImage(null);
  setCroppedImage(null);
  setForm(f => ({ ...f, images: [] }));
};

  // Step navigation
  const handleNext = () => {
    if (activeStep < STEPS.length - 1) setActiveStep((cur) => cur + 1);
  };
  const handlePrev = () => {
    if (activeStep > 0) setActiveStep((cur) => cur - 1);
  };

  // Validate Next button for each step
  const canGoNext = (() => {
    switch (activeStep) {
      case 0:
        return !!form.name.trim();
      case 1:
        return !!form.fundingType;
      case 2:
        if (form.fundingType === "yourself") {
          return useCustomWallet ? !!orgWalletInput.trim() : !!isConnected;
        } else {
          return !!orgWalletInput.trim();
        }
      case 3:
        return !!form.title.trim();
      case 4:
        return !!form.description.trim();
      case 5:
        return !!form.fundingGoal && Number(form.fundingGoal) > 0;
      case 6:
        return form.images.length > 0;
      default:
        return false;
    }
  })();

  // Save relevant field before moving next
  const handleNextWithData = async () => {
    if (activeStep === 2 && form.fundingType === "yourself") {
      setForm(f => ({ ...f, wallet: useCustomWallet ? orgWalletInput : userAddress }));
    }
    if (activeStep === 2 && form.fundingType === "org") {
      setForm(f => ({ ...f, wallet: orgWalletInput }));
    }
    if (activeStep === 6) {
      try {
        // Upload images
        const urls = [];
        for (const file of form.images) {
          const url = await pinataUpload(file);
          urls.push(url);
        }

        // Prepare contract details
        const FACTORY_ADDRESS = "0x343C8076d1A188F0Bb86b5DA795FB367681c3710"; // your deployed address
        const USDC_ADDRESS = "0x038c064836784A78bAeF18f698B78d2ce5bD0134"; // your ERC20Mock address

        // Connect to user's wallet
        if (!window.ethereum) throw new Error("Wallet not found");
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const factory = new Contract(
          FACTORY_ADDRESS,
          ImpactChainFactoryABI.abi,
          signer
        );

        // Parse funding goal to correct decimals (USDC usually uses 6, ERC20Mock might use 18)
        const decimals = 18; // Update if your token is not 18 decimals!
        const goalAmount = parseUnits(form.fundingGoal, decimals);

        // Call createImpactChain
        const tx = await factory.createImpactChain(
          form.name,
          form.wallet,
          USDC_ADDRESS,
          goalAmount,
          form.title,
          form.description,
          urls[0] // or urls.join(',') if you want to store multiple
        );

        console.log("Transaction hash:", tx.hash);

        // Optionally show a loading spinner here...
        await tx.wait(); // Wait for tx confirmation

        alert("Campaign created on blockchain!");
        // Optionally reset the form or redirect user

      } catch (err) {
        alert("Error: " + (err.message ?? err));
      }
      return;
    }
    handleNext();
  };

  // Keyboard: go to next on Enter (except on textarea and file input)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canGoNext && document.activeElement) {
        const tag = document.activeElement.tagName;
        const type = document.activeElement.type;
        if (
          tag !== "TEXTAREA" &&
          !(tag === "INPUT" && type === "file")
        ) {
          e.preventDefault();
          handleNextWithData();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [activeStep, canGoNext, orgWalletInput, form, isConnected, userAddress, useCustomWallet]);

  // Focus input on step change
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [activeStep]);

  // Render each step's form fields
  function renderStep() {
    switch (activeStep) {
      case 0: // Name
        return (
          <>
            <label className="block text-lg font-medium mb-2">What is your name?</label>
            <input
              ref={inputRef}
              className="border-2 border-green-500 rounded w-full p-3 text-lg mb-6"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Enter your name"
              autoFocus
            />
            <div className="flex justify-end">
              <Button
                onClick={handleNextWithData}
                disabled={!canGoNext}
                color="green"
              >
                Next
              </Button>
            </div>
          </>
        );
      case 1: // Funding Type
        return (
          <>
            <label className="block text-lg font-medium mb-2">
              Who are you raising funds for?
            </label>
            <div className="flex space-x-4 mb-6">
              <Button
                variant={form.fundingType === "yourself" ? "filled" : "outlined"}
                color="green"
                onClick={() => setForm(f => ({ ...f, fundingType: "yourself" }))}
              >
                Yourself
              </Button>
              <Button
                variant={form.fundingType === "org" ? "filled" : "outlined"}
                color="green"
                onClick={() => setForm(f => ({ ...f, fundingType: "org" }))}
              >
                Organization
              </Button>
            </div>
            <div className="flex justify-between">
              <Button onClick={handlePrev} variant="text" color="gray">
                Back
              </Button>
              <Button
                onClick={handleNextWithData}
                disabled={!canGoNext}
                color="green"
              >
                Next
              </Button>
            </div>
          </>
        );
      case 2: // Wallet
        if (form.fundingType === "yourself") {
          return (
            <>
              <label className="block text-lg font-medium mb-2">Verify your wallet address</label>
              {!useCustomWallet ? (
                <>
                  <input
                    className="border-2 border-green-500 rounded w-full p-3 text-lg mb-2 bg-gray-100"
                    value={userAddress || ""}
                    readOnly
                  />
                  <button
                    type="button"
                    className="text-green-600 underline text-sm mb-4"
                    onClick={() => setUseCustomWallet(true)}
                  >
                    Or, use a different wallet address
                  </button>
                </>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    className="border-2 border-green-500 rounded w-full p-3 text-lg mb-2"
                    value={orgWalletInput}
                    onChange={e => setOrgWalletInput(e.target.value)}
                    placeholder="0x..."
                    autoFocus
                  />
                  <button
                    type="button"
                    className="text-green-600 underline text-sm mb-4"
                    onClick={() => setUseCustomWallet(false)}
                  >
                    Use connected wallet address
                  </button>
                </>
              )}
              <div className="flex justify-between">
                <Button onClick={handlePrev} variant="text" color="gray">
                  Back
                </Button>
                <Button
                  onClick={handleNextWithData}
                  color="green"
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              </div>
            </>
          );
        }
        // if org
        return (
          <>
            <label className="block text-lg font-medium mb-2">Enter the organization's wallet address</label>
            <input
              ref={inputRef}
              className="border-2 border-green-500 rounded w-full p-3 text-lg mb-6"
              value={orgWalletInput}
              onChange={e => setOrgWalletInput(e.target.value)}
              placeholder="0x..."
              autoFocus
            />
            <div className="flex justify-between">
              <Button onClick={handlePrev} variant="text" color="gray">
                Back
              </Button>
              <Button
                onClick={handleNextWithData}
                color="green"
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </>
        );
      case 3: // Title
        return (
          <>
            <label className="block text-lg font-medium mb-2">Campaign Title</label>
            <input
              ref={inputRef}
              className="border-2 border-green-500 rounded w-full p-3 text-lg mb-6"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Save the Rainforest"
              autoFocus
            />
            <div className="flex justify-between">
              <Button onClick={handlePrev} variant="text" color="gray">
                Back
              </Button>
              <Button
                onClick={handleNextWithData}
                color="green"
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </>
        );
      case 4: // Description
        return (
          <>
            <label className="block text-lg font-medium mb-2">Campaign Description</label>
            <textarea
              ref={inputRef}
              className="border-2 border-green-500 rounded w-full p-3 text-lg mb-6 min-h-[120px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your cause, who it helps, and why it matters"
              autoFocus
            />
            <div className="flex justify-between">
              <Button onClick={handlePrev} variant="text" color="gray">
                Back
              </Button>
              <Button
                onClick={handleNextWithData}
                color="green"
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </>
        );
      case 5: // Funding Goal
        return (
          <>
            <label className="block text-lg font-medium mb-2">Funding Goal (USDC)</label>
            <input
              ref={inputRef}
              type="number"
              min="0"
              step="any"
              className="border-2 border-green-500 rounded w-full p-3 text-lg mb-6"
              value={form.fundingGoal}
              onChange={e => setForm(f => ({ ...f, fundingGoal: e.target.value }))}
              placeholder="Enter your funding goal"
              autoFocus
            />
            <div className="flex justify-between">
              <Button onClick={handlePrev} variant="text" color="gray">
                Back
              </Button>
              <Button
                onClick={handleNextWithData}
                color="green"
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </>
        );
      case 6: // Images
  return (
    <>
      <label className="block text-lg font-medium mb-2">Upload Images</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="mb-6"
        onChange={handleImageChange}
      />
      {showCropper && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="relative w-[300px] h-[200px] sm:w-[450px] sm:h-[300px]">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={3 / 2}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={handleCropCancel} color="gray" variant="outlined">Cancel</Button>
              <Button onClick={handleCropSave} color="green">Crop & Save</Button>
            </div>
          </div>
        </div>
      )}
      {croppedImage && (
        <div className="mb-4">
          <label className="block text-sm mb-1">Preview:</label>
          <img
            src={URL.createObjectURL(croppedImage)}
            alt="Preview"
            className="rounded-lg shadow w-[300px] h-[200px] object-cover"
          />
        </div>
      )}
      <div className="flex justify-between">
        <Button onClick={handlePrev} variant="text" color="gray">
          Back
        </Button>
        <Button
          onClick={handleNextWithData}
          color="green"
          disabled={!canGoNext}
        >
          Submit
        </Button>
      </div>
    </>
  );
      default:
        return null;
    }
  }

  // Stepper with same-sized dots and connecting line
  return (
    <div className="w-full max-w-xl p-8">
      {/* Stepper with connected line */}
      <div className="relative flex items-center mb-8">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-1/2 z-0 h-0.5 bg-gray-300" style={{ transform: 'translateY(-50%)', zIndex: 0 }} />
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className="relative z-10 flex-1 flex justify-center"
            style={{ minWidth: 0 }}
          >
            <button
              type="button"
              aria-label={`Step ${idx + 1}`}
              onClick={() => setActiveStep(idx)}
              className={`
                w-5 h-5 rounded-full border-2 border-white
                flex items-center justify-center
                transition-colors
                ${activeStep === idx || activeStep > idx ? "bg-green-500" : "bg-gray-300"}
                shadow
                focus:outline-none
              `}
              style={{ position: 'relative', zIndex: 2 }}
            />
          </div>
        ))}
      </div>
      {renderStep()}
    </div>
  );
}