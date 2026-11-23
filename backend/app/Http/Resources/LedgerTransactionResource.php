<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class LedgerTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'type' => $this->transaction_type,
            'amount' => $this->amount,
            'currency' => $this->currency_code,
            'date' => $this->transaction_date?->toIso8601String(),
            'description' => $this->description,
            'reference_id' => $this->reference_id,
            'revision' => $this->revision,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
