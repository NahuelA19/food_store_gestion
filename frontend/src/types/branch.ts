export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchListResponse {
  items: Branch[];
  total: number;
}

export interface CreateBranchPayload {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}
