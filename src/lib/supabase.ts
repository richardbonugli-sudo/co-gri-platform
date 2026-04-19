import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aiwcckbkqlwvbibzvupb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpd2Nja2JrcWx3dmJpYnp2dXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNTEwNjcsImV4cCI6MjA0ODkyNzA2N30.tGhDHWXqJbNkBOZqgDwqJkLWJDYBpCCjKCEKhYr0kxc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);