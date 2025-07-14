import React from 'react';
import { Button } from './ui/button';
import { Wand2 } from 'lucide-react';
import DashboardLoading from './dashboard/DashboardLoading';
import { ErrorDisplay } from './ErrorDisplay';
import PageHeader from './navigation/PageHeader';
import OverviewCard from './cards/OverviewCard';
import ListInfoCard from './cards/ListInfoCard';
import ListInfoCardEditModal from './cards/ListInfoCardEditModal';
import InputModal from './modals/InputModal';
import { isApiError } from '../lib/utils';
import { LoadingStates } from './ui/page-loading';
import type { 
  EntityPageConfig, 
  EntityCardConfig, 
  UseEntityPageReturn 
} from '../lib/hooks/useEntityPage';

export interface EntityPageLayoutProps<T = any> {
  config: EntityPageConfig<T>;
  entityPageState: UseEntityPageReturn<T>;
  onGenerate: (params: any) => void;
  generateModalProps?: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    nameType?: string;
    nameRequired?: boolean;
    descriptionLabel?: string;
    descriptionPlaceholder?: string;
    showDescription?: boolean;
    descriptionRequired?: boolean;
    submitLabel?: React.ReactNode;
    cancelLabel?: string;
  };
  children?: React.ReactNode;
  preFieldCards?: React.ReactNode;
  overviewProps?: {
    pageTitle?: string;
    pageSubtitle?: string;
    overviewTitle?: string;
    overviewSubtitle?: string;
    bodyTitle?: string;
    bodyText?: string;
    entityType?: string;
  };
}

export default function EntityPageLayout<T = any>({
  config,
  entityPageState,
  onGenerate,
  generateModalProps,
  children,
  preFieldCards,
  overviewProps,
}: EntityPageLayoutProps<T>) {
  const {
    displayEntity,
    isLoading,
    error,
    progressStage,
    isGenerationModalOpen,
    setIsGenerationModalOpen,
    isGenerating,
    isEditDialogOpen,
    editingField,
    editingItems,
    handleListEdit,
    handleSave,
    closeEditDialog,
    handleOverviewEdit,
    handleRetry,
    showEmptyState,
    autoSave,
  } = entityPageState;

  // Loading state
  if (isLoading) {
    return <LoadingStates.default />;
  }

  // Error state
  if (error) {
    const errorToDisplay = isApiError(error) 
      ? error 
      : { errorCode: 'UNKNOWN_ERROR', message: error.message };
    return (
      <ErrorDisplay 
        error={errorToDisplay} 
        onRetry={handleRetry} 
        onHome={() => window.location.href = '/'} 
      />
    );
  }

  // Empty state
  if (showEmptyState) {
    const IconComponent = config.emptyStateConfig.icon;
    return (
      <>
        <div className="flex flex-col h-full">
          <PageHeader
            title={config.emptyStateConfig.pageTitle}
            subtitle={config.emptyStateConfig.pageSubtitle}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <IconComponent className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-3">
                  {config.emptyStateConfig.overviewTitle}
                </h2>
                <p className="text-gray-600 mb-6">
                  {config.emptyStateConfig.overviewSubtitle}
                </p>
              </div>
              <Button
                onClick={() => setIsGenerationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {config.emptyStateConfig.buttonText}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Generation Modal for Empty State */}
        {generateModalProps && (
          <InputModal
            isOpen={isGenerationModalOpen}
            onClose={() => setIsGenerationModalOpen(false)}
            onSubmit={onGenerate}
            title={generateModalProps.title}
            subtitle={generateModalProps.subtitle}
            nameLabel={generateModalProps.nameLabel}
            namePlaceholder={generateModalProps.namePlaceholder}
            nameType={generateModalProps.nameType}
            nameRequired={generateModalProps.nameRequired}
            descriptionLabel={generateModalProps.descriptionLabel}
            descriptionPlaceholder={generateModalProps.descriptionPlaceholder}
            showDescription={generateModalProps.showDescription}
            descriptionRequired={generateModalProps.descriptionRequired}
            submitLabel={generateModalProps.submitLabel || (
              isGenerating || autoSave.isSaving ? (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </>
              )
            )}
            cancelLabel={generateModalProps.cancelLabel || 'Cancel'}
            isLoading={isGenerating || autoSave.isSaving}
            error={typeof error === 'object' && error && 'message' in error ? (error as any).message : undefined}
          />
        )}
      </>
    );
  }

  // Main content
  const entityName = (displayEntity as any)?.[`${config.entityType}Name`] || 
                    (displayEntity as any)?.name || 
                    config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1);
  
  const entityUrl = (displayEntity as any)?.[`${config.entityType}Url`] || 
                   (displayEntity as any)?.url || '';
  
  const entityDescription = (displayEntity as any)?.description || 'No description available';


  return (
    <>
      <style>{`
        .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      
      <div className="flex flex-col h-full">
        <PageHeader
          title={overviewProps?.pageTitle || `Your ${config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1)}`}
          subtitle={overviewProps?.pageSubtitle || `${config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1)} analysis and insights`}
        />
        
        <div className="flex-1 p-8 space-y-8">
          {/* Overview Card */}
          <OverviewCard
            title={overviewProps?.overviewTitle || entityName}
            subtitle={overviewProps?.overviewSubtitle || entityUrl}
            bodyTitle={overviewProps?.bodyTitle || `${config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1)} Overview`}
            bodyText={overviewProps?.bodyText || entityDescription}
            showButton={false}
            onEdit={handleOverviewEdit}
            entityType={overviewProps?.entityType || config.entityType}
          />
          
          {/* Pre-Field Cards Content (e.g., Firmographics, Buying Signals) */}
          {preFieldCards}
          
          {/* Field Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {config.cardConfigs.map((cardConfig: EntityCardConfig<T>) => {
              const items = displayEntity ? cardConfig.getItems(displayEntity) : [];
              const isEditable = true;

              return (
                <ListInfoCard
                  key={cardConfig.key}
                  title={cardConfig.label}
                  items={items}
                  onEditRequest={isEditable ? (items) => handleListEdit(cardConfig.key, items) : undefined}
                  renderItem={(item: string, idx: number) => (
                    cardConfig.bulleted ? (
                      <span key={idx} className="text-sm text-gray-700 blue-bullet mb-2">
                        {item}
                      </span>
                    ) : (
                      <div key={idx} className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                        {item}
                      </div>
                    )
                  )}
                  editModalSubtitle={cardConfig.subtitle}
                  entityType={config.entityType}
                />
              );
            })}
          </div>
          
          {/* Child entities section */}
          {children}
        </div>
      </div>
      
      {/* Edit Modal */}
      {isEditDialogOpen && editingItems.length > 0 && (
        <ListInfoCardEditModal
          key={editingField}
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          onSave={handleSave}
          initialItems={editingItems}
          title={(() => {
            const config_item = config.cardConfigs.find(cfg => cfg.key === editingField);
            return config_item ? config_item.label : '';
          })()}
          subtitle={(() => {
            const config_item = config.cardConfigs.find(cfg => cfg.key === editingField);
            return config_item ? config_item.subtitle : 'Update the list of items below.';
          })()}
        />
      )}
      
      {/* Generation Modal */}
      {generateModalProps && (
        <InputModal
          isOpen={isGenerationModalOpen}
          onClose={() => setIsGenerationModalOpen(false)}
          onSubmit={onGenerate}
          title={generateModalProps.title}
          subtitle={generateModalProps.subtitle}
          nameLabel={generateModalProps.nameLabel}
          namePlaceholder={generateModalProps.namePlaceholder}
          nameType={generateModalProps.nameType}
          nameRequired={generateModalProps.nameRequired}
          descriptionLabel={generateModalProps.descriptionLabel}
          descriptionPlaceholder={generateModalProps.descriptionPlaceholder}
          showDescription={generateModalProps.showDescription}
          descriptionRequired={generateModalProps.descriptionRequired}
          submitLabel={generateModalProps.submitLabel || (
            isGenerating || autoSave.isSaving ? (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate
              </>
            )
          )}
          cancelLabel={generateModalProps.cancelLabel || 'Cancel'}
          isLoading={isGenerating || autoSave.isSaving}
          error={typeof error === 'object' && error && 'message' in error ? (error as any).message : undefined}
        />
      )}
    </>
  );
}