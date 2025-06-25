import React, { useState, useRef, useEffect } from "react";
import { Stepper, Step, Button } from "@material-tailwind/react";
import { useAccount } from "wagmi";

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

  // Refs for focusing on inputs after tab change
  const inputRef = useRef(null);

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
          return !!isConnected;
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
  const handleNextWithData = () => {
    if (activeStep === 2 && form.fundingType === "yourself") {
      setForm(f => ({ ...f, wallet: userAddress }));
    }
    if (activeStep === 2 && form.fundingType === "org") {
      setForm(f => ({ ...f, wallet: orgWalletInput }));
    }
    if (activeStep === 6) {
      alert(JSON.stringify(form, null, 2));
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
  }, [activeStep, canGoNext, orgWalletInput, form, isConnected, userAddress]);

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
              <p className="mb-4 text-gray-700">
                {isConnected
                  ? `Connected wallet: ${userAddress}`
                  : "Please connect your wallet to verify."}
              </p>
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
              multiple
              accept="image/*"
              className="mb-6"
              onChange={e => setForm(f => ({ ...f, images: Array.from(e.target.files) }))}
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