<template>
    <div class="users-container">
        <div class="card">
            <div class="filters-section">
                <div class="filters-left">
                    <div class="filter-group">
                        <label for="roleFilter" class="filter-label">Role:</label>
                        <Select
                            id="roleFilter"
                            v-model="selectedRole"
                            :options="roleOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="All Roles"
                            @change="applyFilters"
                            class="filter-select"
                        />
                    </div>

                    <div class="filter-group">
                        <label for="nameSearch" class="filter-label">Search:</label>
                        <InputText
                            id="nameSearch"
                            v-model="searchName"
                            placeholder="Search by name..."
                            @input="applyFilters"
                            class="filter-input"
                        />
                    </div>
                </div>

                <div class="filters-right">
                    <Button
                        label="Add User"
                        icon="pi pi-plus"
                        @click="openCreateDialog"
                        class="add-button"
                    />
                </div>
            </div>

            <!-- Users Table -->
            <div class="table-container">
                <DataTable
                    :value="paginatedUsers"
                    :loading="loading"
                    stripedRows
                    responsiveLayout="scroll"
                    class="users-table"
                >
                    <Column field="id" header="ID" class="id-column"></Column>
                    <Column field="name" header="Name" class="name-column"></Column>
                    <Column field="role" header="Role" class="role-column">
                        <template #body="slotProps">
                            <Tag
                                :value="getRoleDisplayName(slotProps.data.role)"
                                :severity="getRoleSeverity(slotProps.data.role)"
                                class="role-tag"
                            />
                        </template>
                    </Column>
                    <Column header="Actions" class="actions-column">
                        <template #body="slotProps">
                            <div class="action-buttons">
                                <Button
                                    icon="pi pi-pencil"
                                    size="small"
                                    @click="openEditDialog(slotProps.data)"
                                    class="edit-button"
                                    v-tooltip="'Edit'"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    @click="confirmDelete(slotProps.data)"
                                    class="delete-button"
                                    v-tooltip="'Delete'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Results Info -->
                <div class="results-info" v-if="!loading">
                    Showing {{ startRecord }} - {{ endRecord }} of {{ totalRecords }} users
                </div>
            </div>

            <!-- Pagination -->
            <div class="pagination-container" v-if="totalRecords > limit">
                <Paginator
                    :rows="limit"
                    :totalRecords="totalRecords"
                    :first="(currentPage - 1) * limit"
                    @page="onPageChange"
                    class="custom-paginator"
                />
            </div>
        </div>

        <!-- Create/Edit User Dialog -->
        <Dialog
            v-model:visible="showDialog"
            :header="dialogMode === 'create' ? 'Create New User' : 'Edit User'"
            modal
            class="user-dialog"
        >
            <div class="dialog-content">
                <div class="form-field">
                    <label for="userName" class="field-label">Name *</label>
                    <InputText
                        id="userName"
                        v-model="userForm.name"
                        :class="{ 'p-invalid': errors.name }"
                        placeholder="Enter user name"
                        class="field-input"
                    />
                    <small class="error-message" v-if="errors.name">{{ errors.name }}</small>
                </div>

                <div class="form-field">
                    <label for="userRole" class="field-label">Role *</label>
                    <Select
                        id="userRole"
                        v-model="userForm.role"
                        :options="roles"
                        optionLabel="label"
                        optionValue="value"
                        :class="{ 'p-invalid': errors.role }"
                        placeholder="Select role"
                        class="field-input"
                    />
                    <small class="error-message" v-if="errors.role">{{ errors.role }}</small>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        @click="closeDialog"
                        class="cancel-button"
                    />
                    <Button
                        :label="dialogMode === 'create' ? 'Create User' : 'Update User'"
                        icon="pi pi-check"
                        @click="saveUser"
                        :loading="saving"
                        class="save-button"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Tag from 'primevue/tag';

export default {
    name: 'UsersTab',
    components: {
        DataTable,
        Column,
        Button,
        Dialog,
        Select,
        InputText,
        Paginator,
        Tag
    },
    data() {
        return {
            loading: false,
            saving: false,
            showDialog: false,
            dialogMode: 'create',
            selectedRole: '',
            searchName: '',
            currentPage: 1,
            limit: 10,
            userForm: {
                id: null,
                name: '',
                role: ''
            },
            errors: {},
            roleOptions: [
                { label: 'All Roles', value: '' },
                { label: 'Project Manager', value: 'project_manager' },
                { label: 'Freelancer', value: 'freelancer' },
                { label: 'Modeller', value: 'modeller' },
                { label: 'Art Director', value: 'art_director' },
                { label: 'Artists', value: 'artist' }
            ],
            roles: [
                { label: 'Project Manager', value: 'project_manager' },
                { label: 'Freelancer', value: 'freelancer' },
                { label: 'Modeller', value: 'modeller' },
                { label: 'Art Director', value: 'art_director' },
                { label: 'Artists', value: 'artist' }
            ]
        };
    },
    computed: {
        ...mapState('users', ['users']),

        filteredUsers() {
            let filtered = [...this.users];

            // Filter by role
            if (this.selectedRole && this.selectedRole !== '') {
                filtered = filtered.filter(user => user.role === this.selectedRole);
            }

            // Filter by name search
            if (this.searchName && this.searchName.trim() !== '') {
                const searchTerm = this.searchName.toLowerCase().trim();
                filtered = filtered.filter(user =>
                    user.name.toLowerCase().includes(searchTerm)
                );
            }

            return filtered;
        },

        totalRecords() {
            return this.filteredUsers.length;
        },

        paginatedUsers() {
            const start = (this.currentPage - 1) * this.limit;
            const end = start + this.limit;
            return this.filteredUsers.slice(start, end);
        },

        startRecord() {
            if (this.totalRecords === 0) return 0;
            return (this.currentPage - 1) * this.limit + 1;
        },

        endRecord() {
            const end = this.currentPage * this.limit;
            return Math.min(end, this.totalRecords);
        }
    },
    async mounted() {
        await this.loadAllUsers();
    },
    methods: {
        ...mapActions('users', ['fetchUsersByRole', 'createUser', 'updateUser', 'deleteUser']),

        async loadAllUsers() {
            this.loading = true;
            try {
                // Загружаем всех пользователей сразу для фронтенд фильтрации
                await this.fetchUsersByRole({
                    role: 'all',
                    page: 1,
                    limit: 1000
                });
                console.log('Loaded users:', this.users);
            } catch (error) {
                console.error('Error loading users:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load users',
                    life: 3000
                });
            } finally {
                this.loading = false;
            }
        },

        applyFilters() {
            // Сбрасываем на первую страницу при применении фильтров
            this.currentPage = 1;
        },

        onPageChange(event) {
            this.currentPage = event.page + 1;
        },

        openCreateDialog() {
            this.dialogMode = 'create';
            this.userForm = { id: null, name: '', role: '' };
            this.errors = {};
            this.showDialog = true;
        },

        openEditDialog(user) {
            this.dialogMode = 'edit';
            this.userForm = { ...user };
            this.errors = {};
            this.showDialog = true;
        },

        closeDialog() {
            this.showDialog = false;
            this.userForm = { id: null, name: '', role: '' };
            this.errors = {};
        },

        validateForm() {
            this.errors = {};

            if (!this.userForm.name || !this.userForm.name.trim()) {
                this.errors.name = 'Name is required';
            }

            if (!this.userForm.role) {
                this.errors.role = 'Role is required';
            }

            return Object.keys(this.errors).length === 0;
        },

        async saveUser() {
            if (!this.validateForm()) return;

            this.saving = true;
            try {
                if (this.dialogMode === 'create') {
                    await this.createUser({
                        name: this.userForm.name.trim(),
                        role: this.userForm.role
                    });
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'User created successfully',
                        life: 3000
                    });
                } else {
                    await this.updateUser({
                        id: this.userForm.id,
                        userData: {
                            name: this.userForm.name.trim(),
                            role: this.userForm.role
                        }
                    });
                    this.$toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'User updated successfully',
                        life: 3000
                    });
                }

                this.closeDialog();
            } catch (error) {
                console.error('Save user error:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.dialogMode === 'create' ? 'Failed to create user' : 'Failed to update user',
                    life: 3000
                });
            } finally {
                this.saving = false;
            }
        },

        confirmDelete(user) {
            this.$confirm.require({
                message: `Are you sure you want to delete "${user.name}"?`,
                header: 'Delete Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptClass: 'p-button-danger',
                accept: () => this.handleDeleteUser(user.id)
            });
        },

        async handleDeleteUser(userId) {
            try {
                await this.deleteUser(userId);
                this.$toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'User deleted successfully',
                    life: 3000
                });

                // Корректируем текущую страницу если нужно
                const maxPage = Math.ceil(this.totalRecords / this.limit);
                if (this.currentPage > maxPage && maxPage > 0) {
                    this.currentPage = maxPage;
                }
            } catch (error) {
                console.error('Delete user error:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete user',
                    life: 3000
                });
            }
        },

        getRoleSeverity(role) {
            const severities = {
                'project_manager': 'success',
                'freelancer': 'info',
                'modeller': 'warn',
                'art_director': 'danger'
            };
            return severities[role] || 'secondary';
        },

        getRoleDisplayName(role) {
            const names = {
                'project_manager': 'Project Manager',
                'freelancer': 'Freelancer',
                'modeller': 'Modeller',
                'art_director': 'Art Director',
                'artist': 'Artist'
            };
            return names[role] || role;
        }
    }
};
</script>

<style scoped>
.users-container {
    padding: 1rem;
    max-width: 100%;
}

.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.card-header {
    padding: 1.5rem 2rem 1rem 2rem;
    border-bottom: 1px solid #e5e7eb;
}

.page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
}

.filters-section {
    padding: 1.5rem 2rem;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.filters-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-label {
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    min-width: fit-content;
}

.filter-select {
    min-width: 140px;
}

.filter-input {
    min-width: 200px;
}

.filters-right {
    display: flex;
    align-items: center;
}

.add-button {
    background: #10b981;
    border-color: #10b981;
    font-weight: 500;
    padding: 0.5rem 1rem;
}

.add-button:hover {
    background: #059669;
    border-color: #059669;
}

.table-container {
    padding: 0 2rem 1rem 2rem;
}

.users-table {
    margin-top: 1rem;
}

.users-table :deep(.p-datatable-thead > tr > th) {
    background: white;
    color: #374151;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
    padding: 1rem;
}

.users-table :deep(.p-datatable-tbody > tr > td) {
    background: white;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.users-table :deep(.p-datatable-tbody > tr:hover) {
    background: white;
}

.id-column {
    width: 80px;
    text-align: center;
}

.name-column {
    min-width: 200px;
}

.role-column {
    width: 180px;
}

.actions-column {
    width: 120px;
}

.role-tag {
    font-weight: 500;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.edit-button {
    background: #f59e0b;
    border-color: #f59e0b;
    width: 2rem;
    height: 2rem;
}

.edit-button:hover {
    background: #d97706;
    border-color: #d97706;
}

.delete-button {
    background: #ef4444;
    border-color: #ef4444;
    width: 2rem;
    height: 2rem;
}

.delete-button:hover {
    background: #dc2626;
    border-color: #dc2626;
}

.results-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
}

.pagination-container {
    padding: 1rem 2rem 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.custom-paginator {
    justify-content: center;
}

.user-dialog {
    min-width: 400px;
}

.user-dialog :deep(.p-dialog-header) {
    background: white;
    border-bottom: 1px solid #e5e7eb;
}

.user-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-weight: 500;
    color: #374151;
}

.field-input {
    width: 100%;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
}

.dialog-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 0 0 0;
}

.cancel-button {
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
}

.cancel-button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.save-button {
    background: #3b82f6;
    border-color: #3b82f6;
}

.save-button:hover {
    background: #2563eb;
    border-color: #2563eb;
}

@media (max-width: 768px) {
    .users-container {
        padding: 0.5rem;
    }

    .card-header {
        padding: 1rem;
    }

    .filters-section {
        padding: 1rem;
        flex-direction: column;
        align-items: stretch;
    }

    .filters-left {
        justify-content: center;
    }

    .filters-right {
        justify-content: center;
    }

    .table-container {
        padding: 0 1rem 1rem 1rem;
    }

    .pagination-container {
        padding: 1rem;
    }

    .user-dialog {
        min-width: 90vw;
    }
}
</style>
