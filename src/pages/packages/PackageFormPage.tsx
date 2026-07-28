import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package } from '../../types';
import { getPackagesApi, createPackageApi, updatePackageApi } from '../../api/packages';
import { PackageForm } from '../../components/forms/PackageForm';
import { RoleGuard } from '../../components/common/RoleGuard';
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
      const allPkgs = await getPackagesApi();
      const found = allPkgs.find((p) => p.id === pkgId);
      if (found) {
        setPackageToEdit(found);
      } else {
        showToast('error', 'Package not found');
        navigate('/packages');
      }
    } catch {
      showToast('error', 'Error fetching package details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: Omit<Package, 'id' | 'whatsappClicks' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    try {
      if (id && packageToEdit) {
        await updatePackageApi(id, formData);
        showToast('success', 'Package updated successfully!');
      } else {
        await createPackageApi(formData);
        showToast('success', 'New package created successfully!');
      }
      navigate('/packages');
    } catch {
      showToast('error', 'Failed to save package');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Package Form..." />;
  }

  return (
    <RoleGuard module="packages" action={id ? 'edit' : 'create'}>
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
    </RoleGuard>
  );
};
