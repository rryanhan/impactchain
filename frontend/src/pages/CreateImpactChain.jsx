import ImpactChainStepperSidebar from '../components/ImpactChainStepperSidebar';
import ImpactChainStepperForm from '../components/ImpactChainStepperForm';

const CreateImpactChain = () => {
  return (
    <div className="flex  bg-gray-50">
      <ImpactChainStepperSidebar />
      {/* Right-side form stepper, e.g.: */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {/* Your form goes here */}
        <ImpactChainStepperForm />
        
      </div>
    </div>
  );
};

export default CreateImpactChain;