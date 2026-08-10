import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package } from '../../types';
import { getPackageApi, createPackageApi, updatePackageApi } from '../../api/packages';
import { PackageForm } from '../../components/forms/PackageForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export const PackageFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [packageToEdit, setPackageToEdit] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadExistingPackage(id);
    }
  }, [id]);

  const loadExistingPackage = async (pkgId: string) => {
    setIsLoading(true);
    try {
      const found = await getPackageApi(pkgId);
      if (found) {
        setPackageToEdit(found);
        console.log('✅ Package loaded for edit:', found.titleEn);
      } else {
        showToast('error', 'Package not found');
        navigate('/packages');
      }
    } catch (error) {
      console.error('❌ Error fetching package:', error);
      showToast('error', 'Error fetching package details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    console.log('📤 PackageFormPage - Submitting FormData');
    setIsSaving(true);
    try {
      let result;
      if (id && packageToEdit) {
        result = await updatePackageApi(id, formData);
        console.log('✅ Package updated:', result);
        showToast('success', 'Package updated successfully!');
      } else {
        result = await createPackageApi(formData);
        console.log('✅ Package created:', result);
        showToast('success', 'New package created successfully!');
      }
      navigate('/packages');
    } catch (error: any) {
      console.error('❌ Error saving package:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save package. Please check all fields.';
      showToast('error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Package Form..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-[#1A1A2E]">
          {id ? `Edit Package: ${packageToEdit?.titleEn}` : 'Create New Umrah / Hajj Package'}
        </h2>
        <p className="text-xs text-[#718096] mt-0.5">Fill in package details, multilingual titles, itinerary, and inclusions.</p>
      </div>

      <PackageForm
        initialData={packageToEdit || undefined}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/packages')}
        isLoading={isSaving}
      />
    </div>
  );
};