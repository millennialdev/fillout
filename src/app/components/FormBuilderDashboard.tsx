/* eslint-disable jsx-a11y/alt-text */
'use client'

import {
 closestCenter,
 DndContext,
 DragEndEvent,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
} from '@dnd-kit/core';
import {
 arrayMove,
 horizontalListSortingStrategy,
 SortableContext,
 sortableKeyboardCoordinates,
 useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
 AlignLeft,
 Calendar,
 Check,
 ChevronDown,
 Clock,
 Copy,
 Edit3,
 FileText,
 Grid3X3,
 Hash,
 Image,
 List,
 Mail,
 Plus,
 ToggleLeft,
 Trash2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Page {
	id: string;
	name: string;
	type: 'cover' | 'page' | 'ending';
}

interface ContextMenuProps {
	x: number;
	y: number;
	onClose: () => void;
	onAction: (action: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	x,
	y,
	onClose,
	onAction,
}) => {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	return (
		<div
			ref={menuRef}
			className='fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'
			style={{ left: x, top: y }}>
			<button
				onClick={() => onAction('rename')}
				className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'>
				<Edit3 className='w-4 h-4' />
				Rename
			</button>
			<button
				onClick={() => onAction('duplicate')}
				className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'>
				<Copy className='w-4 h-4' />
				Duplicate
			</button>
			<div className='h-px bg-gray-200 my-1' />
			<button
				onClick={() => onAction('delete')}
				className='flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left'>
				<Trash2 className='w-4 h-4' />
				Delete
			</button>
		</div>
	);
};

interface SortablePageProps {
	page: Page;
	isActive: boolean;
	onClick: () => void;
	onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

const SortablePage: React.FC<SortablePageProps> = ({
	page,
	isActive,
	onClick,
	onContextMenu,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: page.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const getIcon = () => {
		switch (page.type) {
			case 'cover':
				return <Grid3X3 className='w-4 h-4' />;
			case 'ending':
				return <Check className='w-4 h-4' />;
			default:
				return <FileText className='w-4 h-4' />;
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={{...style, marginInline: 26}}
			{...attributes}
			{...listeners}
			onClick={onClick}
			onContextMenu={(e) => onContextMenu(e, page.id)}
			className={`
        flex items-center gap-2 px-4 py-2 rounded-lg cursor-move select-none transition-all
        ${
			isActive
				? 'bg-gray-900 text-white'
				: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
		}
      `}
      >
			{getIcon()}
			<span className='text-sm font-medium'>{page.name}</span>
		</div>
	);
};

interface AddPageButtonProps {
	onClick: () => void;
	position: number;
}

const AddPageButton: React.FC<AddPageButtonProps> = ({ onClick, position }) => {
	const [isHovered, setIsHovered] = useState(false);
 console.log('AddPageButton rendered at position:', position);

	return (
		<div
			className='relative flex items-center'
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}>
			<div
				className={`
        absolute left-1/2 -translate-x-1/2 transition-all duration-200
        ${isHovered ? 'opacity-100 scale-100' : 'opacity-100 scale-90'}
      `}>
				<button
					onClick={onClick}
					className='w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm'>
					<Plus className='w-4 h-4 text-gray-600' />
				</button>
			</div>
			<div
				className={`
        w-px h-8 bg-gray-300 transition-opacity duration-200
        ${isHovered ? 'opacity-100' : 'opacity-50'}
      `}
			/>
		</div>
	);
};

const FormField = ({
	icon,
	label,
}: {
	icon: React.ReactNode;
	label: string;
}) => (
	<div className='flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
		<div className='w-10 h-10 flex items-center justify-center text-gray-600'>
			{icon}
		</div>
		<span className='text-xs text-gray-600'>{label}</span>
	</div>
);

export default function FormBuilderDashboard() {
	const [pages, setPages] = useState<Page[]>([
		{ id: '1', name: 'Cover', type: 'cover' },
		{ id: '2', name: 'Page 3', type: 'page' },
		{ id: '3', name: 'Page', type: 'page' },
		{ id: '4', name: 'Page 2', type: 'page' },
		{ id: '5', name: 'Ending', type: 'ending' },
	]);

	const [activePage, setActivePage] = useState('1');
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		pageId: string;
	} | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (active.id !== over?.id) {
			setPages((items) => {
				const oldIndex = items.findIndex(
					(item) => item.id === active.id
				);
				const newIndex = items.findIndex(
					(item) => item.id === over?.id
				);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, pageId });
	};

	const handleContextMenuAction = (action: string) => {
		if (contextMenu) {
			alert(`Action: ${action} on page ${contextMenu.pageId}`);
			setContextMenu(null);
		}
	};

	const addPage = (position: number) => {
		const newPage: Page = {
			id: Date.now().toString(),
			name: `Page ${pages.length}`,
			type: 'page',
		};

		const newPages = [...pages];
		newPages.splice(position, 0, newPage);
		setPages(newPages);
		setActivePage(newPage.id);
	};

	const handleAddPageClick = (position: number) => {
		alert(`Adding new page at position ${position}`);
		addPage(position);
	};

	return (
		<div className='h-screen flex flex-col bg-gray-50'>
			{/* Header */}
			<header className='bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between'>
				<div className='flex items-center gap-8'>
					<h1 className='text-lg font-medium text-gray-700'>
						My form
					</h1>
					<nav className='flex gap-28'>
						<button className='text-sm font-medium text-gray-900 pb-2 border-b-2 border-gray-900'>
							Edit
						</button>
						<button className='text-sm font-medium text-gray-500 hover:text-gray-700'>
							Integrate
						</button>
						<button className='text-sm font-medium text-gray-500 hover:text-gray-700'>
							Share
						</button>
						<button className='text-sm font-medium text-gray-500 hover:text-gray-700'>
							Results
						</button>
						<button className='text-sm font-medium text-gray-500 hover:text-gray-700'>
							Settings
						</button>
					</nav>
				</div>
				<div className='flex items-center gap-3'>
					<button className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'>
						Preview
					</button>
					<button className='px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center gap-2'>
						<span className='text-lg'>⚡</span>
						Publish
					</button>
				</div>
			</header>

			{/* Main Content */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Sidebar */}
				<aside className='w-64 bg-white border-r border-gray-200 overflow-y-auto'>
					<div className='p-4'>
						<input
							type='text'
							placeholder='Search fields'
							className='w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='px-4 pb-2'>
						<h3 className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Frequently used
						</h3>
					</div>
					<div className='grid grid-cols-3 gap-1 px-2'>
						<FormField
							icon={<Hash />}
							label='Short answer'
						/>
						<FormField
							icon={<List />}
							label='Multiple choice'
						/>
						<FormField
							icon={<Mail />}
							label='Email input'
						/>
					</div>

					<div className='px-4 pt-6 pb-2'>
						<h3 className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Display text
						</h3>
					</div>
					<div className='grid grid-cols-3 gap-1 px-2'>
						<FormField
							icon={
								<span className='text-lg font-bold'>
									H1
								</span>
							}
							label='Heading'
						/>
						<FormField
							icon={<AlignLeft />}
							label='Paragraph'
						/>
						<FormField
							icon={<Image />}
							label='Banner'
						/>
					</div>

					<div className='px-4 pt-6 pb-2'>
						<h3 className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Choices
						</h3>
					</div>
					<div className='grid grid-cols-3 gap-1 px-2'>
						<FormField
							icon={<ChevronDown />}
							label='Dropdown'
						/>
						<FormField
							icon={<Image />}
							label='Picture choice'
						/>
						<FormField
							icon={<List />}
							label='Multiselect'
						/>
						<FormField
							icon={<ToggleLeft />}
							label='Switch'
						/>
						<FormField
							icon={<List />}
							label='Multiple choice'
						/>
						<FormField
							icon={<Check />}
							label='Checkbox'
						/>
						<FormField
							icon={<Check />}
							label='Checkboxes'
						/>
						<FormField
							icon={<Grid3X3 />}
							label='Choice matrix'
						/>
					</div>

					<div className='px-4 pt-6 pb-2'>
						<h3 className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Time
						</h3>
					</div>
					<div className='grid grid-cols-3 gap-1 px-2'>
						<FormField
							icon={<Calendar />}
							label='Date picker'
						/>
						<FormField
							icon={<Calendar />}
							label='Date time picker'
						/>
						<FormField
							icon={<Clock />}
							label='Time picker'
						/>
					</div>
				</aside>

				{/* Canvas */}
				<main className='flex-1 bg-gray-100 flex items-center justify-center p-8'>
					<div className='w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
						<div className='flex items-center gap-2 mb-8'>
							<div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center'>
								<Edit3 className='w-5 h-5 text-white' />
							</div>
							<span className='text-sm font-medium text-blue-600'>
								Theme
							</span>
						</div>
						<div className='flex items-center justify-center h-64 text-gray-400'>
							<div className='text-center'>
								<div className='w-16 h-16 mx-auto mb-4 text-gray-300'>
									<svg
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='1.5'>
										<path d='M12 4v16m-8-8h16' />
										<circle
											cx='12'
											cy='12'
											r='3'
										/>
									</svg>
								</div>
								<p className='text-sm'>
									Drag and drop questions
									from the left-hand side to
									build your form.
								</p>
							</div>
						</div>
					</div>
				</main>
			</div>

			{/* Bottom Navigation */}
			<footer className='bg-white border-t border-gray-200 px-6 py-4'>
  <div className='flex items-center gap-2'>
    <button
      onClick={() => handleAddPageClick(0)}
      className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors'
    >
      <Plus className='w-4 h-4' />
      Add page
    </button>

    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pages}
        strategy={horizontalListSortingStrategy}
      >
        {/* 🟡  This container now has `gap-6` for extra spacing  */}
        <div className='flex items-center gap-6'>
          {pages.map((page, index) => (
            <React.Fragment key={page.id}>
              {index > 0 && (
                <AddPageButton
                  onClick={() => handleAddPageClick(index)}
                  position={index}
                />
              )}
              <SortablePage
                page={page}
                isActive={activePage === page.id}
                onClick={() => setActivePage(page.id)}
                onContextMenu={handleContextMenu}
              />
            </React.Fragment>
          ))}

          {/* final “+” button */}
          <AddPageButton
            onClick={() => handleAddPageClick(pages.length)}
            position={pages.length}
          />
        </div>
      </SortableContext>
    </DndContext>

    <div className='ml-auto flex items-center gap-4 text-sm text-gray-600'>
      <span>Logic</span>
    </div>
  </div>
</footer>

			{/* Context Menu */}
			{contextMenu && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					onClose={() => setContextMenu(null)}
					onAction={handleContextMenuAction}
				/>
			)}
		</div>
	);
}
