import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Payme API endpoint for handling payment callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate Payme signature (implement actual validation)
    const isValidPaymeRequest = validatePaymeRequest(body);
    if (!isValidPaymeRequest) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { method, params } = body;

    switch (method) {
      case 'CheckPerformTransaction':
        return await checkTransaction(params);
      case 'CreateTransaction':
        return await createTransaction(params);
      case 'PerformTransaction':
        return await performTransaction(params);
      case 'CancelTransaction':
        return await cancelTransaction(params);
      case 'CheckTransaction':
        return await checkTransactionStatus(params);
      case 'GetStatement':
        return await getStatement(params);
      default:
        return NextResponse.json(
          { error: 'Method not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validatePaymeRequest(body: any): boolean {
  // Implement Payme signature validation
  // This is a placeholder - implement actual validation
  return true;
}

async function checkTransaction(params: any) {
  const { account, amount, id } = params;
  
  // Check if user exists and subscription is valid
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', account.user_id)
    .single();

  if (error || !user) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        allow: false,
        error: {
          code: -32504,
          message: 'User not found'
        }
      }
    });
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      allow: true
    }
  });
}

async function createTransaction(params: any) {
  const { account, amount, id, time } = params;
  
  // Create transaction record
  const { data: transaction, error } = await supabase
    .from('orders')
    .insert({
      user_id: account.user_id,
      number: `INV-${Date.now()}`,
      amount: amount / 100, // Convert from tiyin to UZS
      total: amount / 100, // Add total property
      currency: 'UZS',
      status: 'OPEN',
      metadata: {
        payme_transaction_id: id,
        payme_time: time
      },
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        error: {
          code: -32500,
          message: 'Failed to create transaction'
        }
      }
    });
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      create_time: Date.now(),
      transaction: transaction.id,
      state: 1
    }
  });
}

async function performTransaction(params: any) {
  const { id, account, amount } = params;
  
  // Find transaction
  const { data: invoice, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('metadata->>payme_transaction_id', id)
    .single();

  if (findError || !invoice) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        error: {
          code: -32400,
          message: 'Transaction not found'
        }
      }
    });
  }

  // Update invoice status to paid
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString()
    })
    .eq('id', invoice.id);

  if (updateError) {
    console.error('Error updating invoice:', updateError);
  }

  // Update user subscription
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', account.user_id)
    .single();

  if (user && !userError) {
    // Activate or extend subscription
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('price', amount / 100)
      .eq('is_active', true)
      .single();

    if (plan && !planError) {
      // First check if subscription exists
      const { data: existingSubscription, error: existingError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingSubscription && !existingError) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'ACTIVE',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            status: 'ACTIVE',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      perform_time: Date.now(),
      transaction: invoice.id,
      state: 2
    }
  });
}

async function cancelTransaction(params: any) {
  const { id } = params;
  
  // Find and cancel transaction
  const { data: invoice, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('metadata->>payme_transaction_id', id)
    .single();

  if (invoice && !findError) {
    await supabase
      .from('orders')
      .update({ status: 'VOID' })
      .eq('id', invoice.id);
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      cancel_time: Date.now(),
      transaction: invoice?.id,
      state: -1
    }
  });
}

async function checkTransactionStatus(params: any) {
  const { id } = params;
  
  const { data: invoice, error } = await supabase
    .from('orders')
    .select('*')
    .eq('metadata->>payme_transaction_id', id)
    .single();

  const state = invoice?.status === 'PAID' ? 2 : 1;

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    result: {
      create_time: invoice ? new Date(invoice.created_at).getTime() : Date.now(),
      perform_time: invoice?.paid_at ? new Date(invoice.paid_at).getTime() : 0,
      cancel_time: 0,
      transaction: invoice?.id,
      state,
      reason: 0
    }
  });
}

async function getStatement(params: any) {
  const { from, to } = params;
  
  const { data: invoices, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', new Date(Number(from)).toISOString())
    .lte('created_at', new Date(Number(to)).toISOString());

  const transactions = (invoices || []).map((invoice: any) => ({
    id: invoice.id,
    time: new Date(invoice.created_at).getTime(),
    amount: Number(invoice.amount) * 100, // Convert to tiyin
    type: 1, // Payment
    state: invoice.status === 'PAID' ? 2 : 1
  }));

  return NextResponse.json({
    jsonrpc: '2.0',
    id: params.id,
    result: {
      transactions
    }
  });
}
