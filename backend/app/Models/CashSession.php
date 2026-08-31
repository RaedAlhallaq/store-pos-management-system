<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'opening_cash',
        'closing_cash_expected',
        'closing_cash_actual',
        'difference_amount',
        'total_sales_cash',
        'total_sales_card',
        'total_sales_credit',
        'total_expenses_cash',
        'status',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'opening_cash' => 'decimal:2',
        'closing_cash_expected' => 'decimal:2',
        'closing_cash_actual' => 'decimal:2',
        'difference_amount' => 'decimal:2',
        'total_sales_cash' => 'decimal:2',
        'total_sales_card' => 'decimal:2',
        'total_sales_credit' => 'decimal:2',
        'total_expenses_cash' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'cash_session_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class, 'cash_session_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'cash_session_id');
    }

    public function customerPayments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class, 'cash_session_id');
    }

    public function supplierPayments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class, 'cash_session_id');
    }
}
