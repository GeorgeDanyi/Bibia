import React from 'react'
import { Star, Heart, MapPin } from 'lucide-react'

export type Provider = {
	id: string
	name: string
	title?: string
	avatar?: string
	score?: number
	distanceKm?: number
	place?: string
	timeShort?: string
	languagesShort?: string
	years?: number
	rating?: number
	price?: number
	reasons?: string[]
}

export type ProviderCardProps = {
	provider: Provider
	saved?: boolean
	onReserve?: (id: string) => void
	onDetail?: (id: string) => void
	onToggleSave?: (id: string) => void
	onCompareToggle?: (id: string, checked: boolean) => void
	compareChecked?: boolean
}

export default function ProviderCard({ provider, saved, onReserve, onDetail, onToggleSave, onCompareToggle, compareChecked }: ProviderCardProps) {
	return (
		<div className="w-[560px] h-[220px] bg-white rounded-2xl shadow-sm hover:shadow-md transition-transform duration-150 hover:-translate-y-[2px] p-4 flex gap-4">
			{/* Avatar */}
			<img
				src={provider.avatar || '/images/avatar1.svg'}
				alt={provider.name}
				className="w-16 h-16 rounded-full object-cover bg-gray-100 mt-1"
			/>

			{/* Main */}
			<div className="flex-1 min-w-0 flex flex-col">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-gray-900 truncate">{provider.name}</h3>
							{typeof provider.score === 'number' && (
								<span className="px-2 py-0.5 text-xs rounded-full bg-[#ECFDF5] text-[#065F46] font-medium whitespace-nowrap">
									{provider.score >= 75
										? 'Vysoká shoda'
										: provider.score >= 55
											? 'Dobrá shoda'
											: 'Možná shoda'}
								</span>
							)}
						</div>
						{provider.title && <p className="text-sm text-gray-600 truncate">{provider.title}</p>}
					</div>
					<button
						aria-label={saved ? 'Odebrat z uložených' : 'Uložit'}
						onClick={() => onToggleSave && onToggleSave(provider.id)}
						className={`p-2 rounded-lg border ${saved ? 'border-[#1A8E76] text-[#1A8E76] bg-[#ECFDF5]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
					>
						<Heart className={`w-4 h-4 ${saved ? 'fill-[#1A8E76]' : ''}`} />
					</button>
				</div>

				{/* Badges */}
				<div className="flex flex-wrap gap-1 mt-2">
					{typeof provider.distanceKm === 'number' && (
						<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{provider.distanceKm} km</span>
					)}
					{provider.place && (
						<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{provider.place}</span>
					)}
					{provider.timeShort && (
						<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{provider.timeShort}</span>
					)}
					{provider.languagesShort && (
						<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{provider.languagesShort}</span>
					)}
				</div>

				{/* Meta line */}
				{(provider.years || provider.rating || provider.price) && (
					<div className="text-xs text-gray-600 mt-2">
						{provider.years ? `${provider.years} let praxe` : ''}
						{provider.years && (provider.rating || provider.price) ? ' • ' : ''}
						{provider.rating ? `${provider.rating}★` : ''}
						{provider.rating && provider.price ? ' • ' : ''}
						{provider.price ? `od ${provider.price} Kč` : ''}
					</div>
				)}

				{/* Reasons */}
				{provider.reasons && provider.reasons.length > 0 && (
					<div className="mt-2">
						<p className="text-xs text-gray-700 font-medium mb-1">Proč doporučujeme</p>
						<ul className="list-disc pl-5 space-y-0.5 text-xs text-gray-600">
							{provider.reasons.slice(0, 4).map((r, i) => (
								<li key={i}>{r}</li>
							))}
						</ul>
					</div>
				)}

				{/* Actions */}
				<div className="mt-auto pt-3 flex items-center justify-between">
					<label className="flex items-center gap-2 text-xs text-gray-700">
						<input
							type="checkbox"
							checked={!!compareChecked}
							onChange={(e) => onCompareToggle && onCompareToggle(provider.id, e.target.checked)}
						/>
						Porovnat
					</label>
					<div className="flex gap-2">
						<button
							onClick={() => onDetail && onDetail(provider.id)}
							className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Detail
						</button>
						<button
							onClick={() => onReserve && onReserve(provider.id)}
							className="px-4 py-2 text-xs bg-[#1A8E76] text-white rounded-lg hover:bg-[#157866]"
						>
							Kontaktovat
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
