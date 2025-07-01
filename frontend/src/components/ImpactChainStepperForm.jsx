import React, { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { Stepper, Step, Button } from "@material-tailwind/react";
import { useAccount } from "wagmi";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { pinataUpload } from "../pinataUpload";
import ImpactChainFactoryABI from "../abi/ImpactChainFactory.json";

const STEPS = [
  "Name",
  "Funding Type",
  "Wallet Address",
  "Title",
  "Description",
  "Funding Goal",
  "Images"
];

// Helper hook for preview URLs
function useImagePreviews(blobs) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const newUrls = blobs.map(blob => (blob ? URL.createObjectURL(blob) : null));
    setUrls(newUrls);

    return () => {
      newUrls.forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [blobs]);

  return urls;
}

export default function ImpactChainStepperForm() {
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

  // Image cropping state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]); // Array of blobs
  const [cropperImageUrl, setCropperImageUrl] = useState("");
  const previewUrls = useImagePreviews(croppedImages);

  // Refs for focusing on inputs after tab change
  const inputRef = useRef(null);

  // Cropper callback
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Update cropper image URL when needed
  useEffect(() => {
    if (showCropper && selectedImageIdx !== null && form.images[selectedImageIdx]) {
      const url = URL.createObjectURL(form.images[selectedImageIdx]);
      setCropperImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [showCropper, selectedImageIdx, form.images]);

  // Handle file input change (multiple images)
  const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    setForm(f => {
      const newImages = [...f.images, ...files].slice(0, 5);
      return { ...f, images: newImages };
    });
    setCroppedImages(prev => {
      const newArr = [...prev, ...new Array(files.length)].slice(0, 5);
      return newArr;
    });
    setSelectedImageIdx(form.images.length); // Start cropping at the first new image
    setShowCropper(true);
  }
};


  // Crop and save the current image, then move to next or finish
  const handleCropSave = async () => {
  const file = form.images[selectedImageIdx];
  const imageUrl = cropperImageUrl;
  const cropped = await getCroppedImg(imageUrl, croppedAreaPixels, 600, 400);
  setCroppedImages(prev => {
    const arr = [...prev];
    arr[selectedImageIdx] = cropped;
    console.log("Cropped images array after cropping:", arr);
    return arr;
  });


    // Move to next image if exists, else close cropper
    if (selectedImageIdx < form.images.length - 1) {
      setSelectedImageIdx(selectedImageIdx + 1);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      setShowCropper(false);
      setSelectedImageIdx(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleRemoveImage = (idx) => {
  setForm(f => {
    const newImages = [...f.images];
    newImages.splice(idx, 1);
    return { ...f, images: newImages };
  });
  setCroppedImages(prev => {
    const arr = [...prev];
    arr.splice(idx, 1);
    return arr;
  });
};

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageIdx(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedImages([]);
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
        return form.images.length > 0 && croppedImages.length === form.images.length;
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
        // Upload images (use cropped blobs if available)
        const urls = [];
        for (let i = 0; i < form.images.length; i++) {
          const file = croppedImages[i]
            ? new File([croppedImages[i]], `image${i}.jpg`, { type: "image/jpeg" })
            : form.images[i];
          const url = await pinataUpload(file);
          urls.push(url);
        }

        // Prepare contract details
        const FACTORY_ADDRESS = "0x343C8076d1A188F0Bb86b5DA795FB367681c3710";
        const USDC_ADDRESS = "0x038c064836784A78bAeF18f698B78d2ce5bD0134";

        if (!window.ethereum) throw new Error("Wallet not found");
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const factory = new Contract(
          FACTORY_ADDRESS,
          ImpactChainFactoryABI.abi,
          signer
        );

        const decimals = 18;
        const goalAmount = parseUnits(form.fundingGoal, decimals);

        // Store all image URLs as a comma-separated string
        const imageUrlString = urls.join(",");

        console.log("Submitting campaign with params:", {
      name: form.name,
      wallet: form.wallet,
      USDC_ADDRESS,
      goalAmount: goalAmount.toString(),
      title: form.title,
      description: form.description,
      imageUrlString,
    });

        const tx = await factory.createImpactChain(
          form.name,
          form.wallet,
          USDC_ADDRESS,
          goalAmount,
          form.title,
          form.description,
          imageUrlString // store all images as a single string
        );

        console.log("Transaction hash:", tx.hash);

        alert(
            "Your campaign transaction has been submitted!\n\n" +
            "MetaMask may take a minute or two to confirm it. " +
            "You can check your profile to see your campaign once it is approved on the blockchain."
            );
        await tx.wait();

        setForm({
            name: "",
            fundingType: "",
            wallet: "",
            title: "",
            description: "",
            fundingGoal: "",
            images: [],
            });
            setOrgWalletInput("");
            setUseCustomWallet(false);
            setCroppedImages([]);
            setActiveStep(0);

        alert("Campaign created on blockchain!");
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
  }, [activeStep, canGoNext, orgWalletInput, form, isConnected, userAddress, useCustomWallet, croppedImages]);

  // Focus input on step change
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [activeStep]);

    const dropRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (form.images.length >= 5) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      setForm(f => {
        const newImages = [...f.images, ...files].slice(0, 5);
        return { ...f, images: newImages };
      });
      setCroppedImages(prev => {
        const newArr = [...prev, ...new Array(files.length)].slice(0, 5);
        return newArr;
      });
      setSelectedImageIdx(form.images.length);
      setShowCropper(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleZoneClick = () => {
    if (form.images.length < 5 && dropRef.current) {
      dropRef.current.value = null; // allow re-uploading same file
      dropRef.current.click();
    }
  };

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
            <label className="block text-lg font-medium mb-2">
              Upload Cover Photo (required) and More Images (optional)
            </label>
            <div
                className={`
                    border-2 border-dashed border-green-400 rounded-lg p-6 mb-6 flex flex-col items-center justify-center cursor-pointer transition
                    ${form.images.length >= 5 ? "opacity-50 cursor-not-allowed" : "hover:border-green-600"}
                `}
                style={{ minHeight: 120 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleZoneClick}
                >
                <input
                    ref={dropRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                    disabled={form.images.length >= 5}
                />
                <span className="text-green-700 font-medium">
                    Drag & drop images here, or <span className="underline">click to upload</span>
                </span>
                <span className="text-gray-500 text-xs mt-1">
                    {form.images.length}/5 images selected
                </span>
                </div>
            {/* Cropping modal for each image */}
            {showCropper && selectedImageIdx !== null && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="relative w-[300px] h-[200px] sm:w-[450px] sm:h-[300px]">
                    <Cropper
                      image={cropperImageUrl}
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
                    <Button onClick={handleCropSave} color="green">
                      {selectedImageIdx < form.images.length - 1 ? "Crop & Next" : "Crop & Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Preview cropped images */}
            {croppedImages.length > 0 && (
  <div className="mb-4 flex">
    {/* Cover photo */}
    <div className="relative mr-4 group">
  <img
    src={previewUrls[0]}
    alt="Cover"
    className="rounded-lg shadow w-[300px] h-[200px] object-cover"
  />
  <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
    Cover Photo
  </span>
  {/* Remove button for cover */}
  <button
    type="button"
    onClick={() => handleRemoveImage(0)}
    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
    style={{ pointerEvents: "auto" }}
    aria-label="Remove"
  >
    ×
  </button>
</div>
    {/* 2x2 grid for next 4 images */}
    <div className="grid grid-cols-2 grid-rows-2 gap-2">
      {[1, 2, 3, 4].map(i =>
        previewUrls[i] ? (
          <div key={i} className="relative group">
            <img
                src={previewUrls[i]}
                alt={`Preview ${i + 1}`}
                className="rounded-lg shadow w-24 h-16 object-cover"
            />
            <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ pointerEvents: "auto" }}
                aria-label="Remove"
            >
                ×
            </button>
            </div>
        ) : null
      )}
    </div>
  </div>
)}
{/* Show upload warning if max reached */}
{form.images.length >= 5 && (
  <div className="text-red-600 text-sm mb-2">Maximum 5 images allowed.</div>
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