import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export interface RevenueStats {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  previousRevenue: number;
  previousOrderCount: number;
  revenueChange: number;
  orderChange: number;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  previousNewCustomers: number;
  customerChange: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string | null;
  revenue: number;
  unitsSold: number;
  image_url: string | null;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface HourlyDistribution {
  day: number;
  hour: number;
  count: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  email: string;
  total: number;
  created_at: string;
  status: string | null;
}

export type TimePeriod = 'week' | 'month' | 'year';

function getDateRange(period: TimePeriod): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const today = startOfDay(now);
  
  switch (period) {
    case 'week':
      return {
        start: subDays(today, 7),
        end: today,
        previousStart: subDays(today, 14),
        previousEnd: subDays(today, 7),
      };
    case 'month':
      return {
        start: subDays(today, 30),
        end: today,
        previousStart: subDays(today, 60),
        previousEnd: subDays(today, 30),
      };
    case 'year':
      return {
        start: subDays(today, 365),
        end: today,
        previousStart: subDays(today, 730),
        previousEnd: subDays(today, 365),
      };
  }
}

export function useRevenueStats(period: TimePeriod = 'month') {
  const { start, end, previousStart, previousEnd } = getDateRange(period);

  return useQuery({
    queryKey: ['analytics-revenue', period],
    queryFn: async (): Promise<RevenueStats> => {
      // Current period
      const { data: currentOrders, error: currentError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('payment_status', 'completed');

      if (currentError) throw currentError;

      // Previous period
      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString())
        .eq('payment_status', 'completed');

      if (previousError) throw previousError;

      const totalRevenue = currentOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const orderCount = currentOrders?.length || 0;
      const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      const previousRevenue = previousOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const previousOrderCount = previousOrders?.length || 0;

      const revenueChange = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : totalRevenue > 0 ? 100 : 0;
      
      const orderChange = previousOrderCount > 0 
        ? ((orderCount - previousOrderCount) / previousOrderCount) * 100 
        : orderCount > 0 ? 100 : 0;

      return {
        totalRevenue,
        orderCount,
        avgOrderValue,
        previousRevenue,
        previousOrderCount,
        revenueChange,
        orderChange,
      };
    },
  });
}

export function useCustomerStats(period: TimePeriod = 'month') {
  const { start, end, previousStart, previousEnd } = getDateRange(period);

  return useQuery({
    queryKey: ['analytics-customers', period],
    queryFn: async (): Promise<CustomerStats> => {
      // Get all orders with customer emails
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('email, created_at')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: true });

      if (allError) throw allError;

      const orders = allOrders || [];
      
      // Track first order date for each customer
      const customerFirstOrder: Record<string, Date> = {};
      const customerOrderCounts: Record<string, number> = {};

      orders.forEach(order => {
        const email = order.email.toLowerCase();
        const orderDate = new Date(order.created_at!);
        
        if (!customerFirstOrder[email] || orderDate < customerFirstOrder[email]) {
          customerFirstOrder[email] = orderDate;
        }
        customerOrderCounts[email] = (customerOrderCounts[email] || 0) + 1;
      });

      // Calculate current period stats
      const totalCustomers = Object.keys(customerFirstOrder).length;
      const newCustomers = Object.entries(customerFirstOrder)
        .filter(([_, date]) => date >= start && date <= end)
        .length;
      const repeatCustomers = Object.values(customerOrderCounts)
        .filter(count => count > 1)
        .length;
      const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      // Calculate previous period new customers
      const previousNewCustomers = Object.entries(customerFirstOrder)
        .filter(([_, date]) => date >= previousStart && date <= previousEnd)
        .length;

      const customerChange = previousNewCustomers > 0 
        ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 
        : newCustomers > 0 ? 100 : 0;

      return {
        totalCustomers,
        newCustomers,
        repeatCustomers,
        repeatRate,
        previousNewCustomers,
        customerChange,
      };
    },
  });
}

export function useTopProducts(limit: number = 5) {
  return useQuery({
    queryKey: ['analytics-top-products', limit],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          product_price,
          quantity,
          total,
          products (
            id,
            name,
            image_url,
            categories (name)
          )
        `);

      if (error) throw error;

      // Aggregate by product
      const productMap: Record<string, TopProduct> = {};

      orderItems?.forEach(item => {
        const productId = item.product_id || item.product_name;
        if (!productMap[productId]) {
          const product = item.products as any;
          productMap[productId] = {
            id: item.product_id || '',
            name: product?.name || item.product_name,
            category: product?.categories?.name || null,
            revenue: 0,
            unitsSold: 0,
            image_url: product?.image_url || null,
          };
        }
        productMap[productId].revenue += Number(item.total);
        productMap[productId].unitsSold += item.quantity;
      });

      return Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
  });
}

export function useSalesTimeSeries(period: TimePeriod = 'month') {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ['analytics-timeseries', period],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('payment_status', 'completed');

      if (error) throw error;

      // Create date buckets
      let intervals: Date[];
      let formatStr: string;

      switch (period) {
        case 'week':
          intervals = eachDayOfInterval({ start, end });
          formatStr = 'MMM d';
          break;
        case 'month':
          intervals = eachDayOfInterval({ start, end });
          formatStr = 'MMM d';
          break;
        case 'year':
          intervals = eachMonthOfInterval({ start, end });
          formatStr = 'MMM yyyy';
          break;
      }

      const dataMap: Record<string, TimeSeriesData> = {};
      
      intervals.forEach(date => {
        const key = format(date, formatStr);
        dataMap[key] = { date: key, revenue: 0, orders: 0 };
      });

      orders?.forEach(order => {
        const orderDate = new Date(order.created_at!);
        const key = format(orderDate, formatStr);
        if (dataMap[key]) {
          dataMap[key].revenue += Number(order.total);
          dataMap[key].orders += 1;
        }
      });

      return Object.values(dataMap);
    },
  });
}

export function useOrderHourlyDistribution() {
  return useQuery({
    queryKey: ['analytics-hourly'],
    queryFn: async (): Promise<HourlyDistribution[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('payment_status', 'completed');

      if (error) throw error;

      // Initialize 7x24 grid (but we'll show 7am-9pm for juice bar hours)
      const distribution: Record<string, number> = {};

      orders?.forEach(order => {
        const date = new Date(order.created_at!);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        const key = `${day}-${hour}`;
        distribution[key] = (distribution[key] || 0) + 1;
      });

      const result: HourlyDistribution[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 7; hour <= 21; hour++) { // 7am to 9pm
          result.push({
            day,
            hour,
            count: distribution[`${day}-${hour}`] || 0,
          });
        }
      }

      return result;
    },
  });
}

export function useRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ['analytics-recent', limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, email, total, created_at, status')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RecentOrder[];
    },
  });
}

export function useCategoryDistribution() {
  return useQuery({
    queryKey: ['analytics-categories'],
    queryFn: async () => {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          total,
          products (
            categories (name)
          )
        `);

      if (error) throw error;

      const categoryMap: Record<string, number> = {};

      orderItems?.forEach(item => {
        const product = item.products as any;
        const categoryName = product?.categories?.name || 'Uncategorized';
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + Number(item.total);
      });

      return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
}
