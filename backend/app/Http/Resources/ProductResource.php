<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cost = (float) $this->cost_price;
        $selling = (float) $this->selling_price;
        $profitMargin = $selling - $cost;
        $profitPercentage = $cost > 0 ? round(($profitMargin / $cost) * 100, 2) : 0;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'barcode' => $this->barcode,
            'sku' => $this->sku,
            'category_id' => $this->category_id,
            'unit_id' => $this->unit_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'cost_price' => $this->cost_price,
            'selling_price' => $this->selling_price,
            'tax_percent' => $this->tax_percent,
            'stock_quantity' => $this->stock_quantity,
            'min_stock_alert' => $this->min_stock_alert,
            'is_low_stock' => (float) $this->stock_quantity <= (float) $this->min_stock_alert,
            'is_out_of_stock' => (float) $this->stock_quantity <= 0,
            'profit_margin' => number_format($profitMargin, 2, '.', ''),
            'profit_percentage' => $profitPercentage,
            'image' => $this->image,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
