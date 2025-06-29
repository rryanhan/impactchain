import React, { useState, useRef, useEffect } from "react";
import { Stepper, Step, Button } from "@material-tailwind/react";
import { useAccount, useWriteContract, useSimulateContract } from "wagmi";
import { parseUnits } from "ethers";

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
    "Images",
    "Deletion Settings"
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
        allowDeletion: false,
    });
    const [orgWalletInput, setOrgWalletInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for focusing on inputs after tab change
    const inputRef = useRef(null);

    // Simulate contract write
    const { data: simulationData } = useSimulateContract({
        address: "0x343C8076d1A188F0Bb86b5DA795FB367681c3710", // FACTORY_ADDRESS
        abi: ImpactChainFactoryABI.abi,
        functionName: "createImpactChain",
        args: form.wallet && form.fundingGoal ? [
            form.name,
            form.wallet,
            "0x038c064836784A78bAeF18f698B78d2ce5bD0134", // USDC_ADDRESS
            parseUnits(form.fundingGoal, 18),
            form.title,
            form.description,
            "", // image URL will be set dynamically
            form.allowDeletion
        ] : undefined,
        query: {
            enabled: false, // We'll enable this manually when submitting
        },
    });

    const { writeContract, isPending: isCreating } = useWriteContract();

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
            case 7:
                return true;
            default:
                return false;
        }
    })();

    // Save relevant field before moving next
    const handleNextWithData = async () => {
        if (activeStep === 2 && form.fundingType === "yourself") {
            setForm(f => ({ ...f, wallet: userAddress }));
        }
        if (activeStep === 2 && form.fundingType === "org") {
            setForm(f => ({ ...f, wallet: orgWalletInput }));
        }
        if (activeStep === 7) {
            try {
                setIsSubmitting(true);

                // Upload images
                const urls = [];
                for (const file of form.images) {
                    const url = await pinataUpload(file);
                    urls.push(url);
                }

                // Create campaign using wagmi's writeContract
                writeContract({
                    address: "0x343C8076d1A188F0Bb86b5DA795FB367681c3710", // FACTORY_ADDRESS
                    abi: ImpactChainFactoryABI.abi,
                    functionName: "createImpactChain",
                    args: [
                        form.name,
                        form.wallet,
                        "0x038c064836784A78bAeF18f698B78d2ce5bD0134", // USDC_ADDRESS
                        parseUnits(form.fundingGoal, 18),
                        form.title,
                        form.description,
                        urls[0], // or urls.join(',') if you want to store multiple
                        form.allowDeletion
                    ]
                });

                alert("Campaign creation initiated! Check your wallet for transaction.");
                // Optionally reset the form or redirect user

            } catch (err) {
                console.error("Error creating campaign:", err);
                alert("Error: " + (err.message ?? err));
            } finally {
                setIsSubmitting(false);
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
                                disabled={!canGoNext}
                                color="green"
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
                                disabled={!canGoNext}
                                color="green"
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
                                disabled={!canGoNext}
                                color="green"
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
                                disabled={!canGoNext}
                                color="green"
                            >
                                Next
                            </Button>
                        </div>
                    </>
                );
            case 7: // Deletion Settings
                return (
                    <>
                        <label className="block text-lg font-medium mb-2">Impact Proof Deletion Settings</label>
                        <div className="mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-blue-900 mb-2">ℹ️ About Impact Proof Deletion</h4>
                                <p className="text-blue-800 text-sm mb-3">
                                    By default, impact proofs are permanent and cannot be deleted (blockchain immutability).
                                    However, you can enable deletion if you want the ability to correct mistakes or remove inappropriate content.
                                </p>
                                <div className="text-blue-800 text-sm">
                                    <p><strong>If enabled:</strong></p>
                                    <ul className="list-disc list-inside mt-1">
                                        <li>You can delete impact proofs you've uploaded</li>
                                        <li>Deletion events are logged on the blockchain</li>
                                        <li>This setting cannot be changed after campaign creation</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="allowDeletion"
                                    checked={form.allowDeletion}
                                    onChange={e => setForm(f => ({ ...f, allowDeletion: e.target.checked }))}
                                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="allowDeletion" className="text-lg">
                                    Allow deletion of impact proofs
                                </label>
                            </div>

                            {form.allowDeletion && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm">
                                        ⚠️ <strong>Warning:</strong> Enabling deletion means impact proofs can be removed.
                                        This reduces the immutability guarantee of your campaign.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <Button onClick={handlePrev} variant="text" color="gray">
                                Back
                            </Button>
                            <Button
                                onClick={handleNextWithData}
                                disabled={!canGoNext || isSubmitting || isCreating}
                                color="green"
                            >
                                {isSubmitting || isCreating ? "Creating..." : "Submit"}
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