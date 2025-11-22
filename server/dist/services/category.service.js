"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
class CategoryService {
    constructor() {
        this.categories = [
            {
                id: 'home',
                bangla: 'বাসা বাড়ি',
                english: 'Home',
                color: '#3FA564',
                icon: 'home',
                subcategories: [
                    {
                        id: 'not_collecting_waste',
                        bangla: 'বাসা বাড়ির ময়লা নিচ্ছে না',
                        english: 'Not collecting household waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার আচরণ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত ইস্যু',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'road_environment',
                bangla: 'রাস্তা ও পরিবেশ',
                english: 'Road & Environment',
                color: '#FF9800',
                icon: 'road',
                subcategories: [
                    {
                        id: 'road_waste',
                        bangla: 'রাস্তার ধারে ময়লা',
                        english: 'Waste beside the road'
                    },
                    {
                        id: 'water_logging',
                        bangla: 'রাস্তায় পানি জমে আছে',
                        english: 'Water logging on road'
                    },
                    {
                        id: 'manhole_issue',
                        bangla: 'ম্যানহোল ঢাকনা নেই',
                        english: 'Missing manhole cover'
                    }
                ]
            },
            {
                id: 'business',
                bangla: 'ব্যবসায়িক প্রতিষ্ঠান',
                english: 'Business',
                color: '#2196F3',
                icon: 'business',
                subcategories: [
                    {
                        id: 'not_collecting',
                        bangla: 'ময়লা নিচ্ছে না',
                        english: 'Not collecting waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার খারাপ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত সমস্যা',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'office',
                bangla: 'অফিস',
                english: 'Office',
                color: '#9C27B0',
                icon: 'office',
                subcategories: [
                    {
                        id: 'not_collecting',
                        bangla: 'ময়লা নিচ্ছে না',
                        english: 'Not collecting waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার খারাপ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত সমস্যা',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'education',
                bangla: 'শিক্ষা প্রতিষ্ঠান',
                english: 'Education',
                color: '#F44336',
                icon: 'education',
                subcategories: [
                    {
                        id: 'not_collecting',
                        bangla: 'ময়লা নিচ্ছে না',
                        english: 'Not collecting waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার খারাপ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত সমস্যা',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'hospital',
                bangla: 'হাসপাতাল',
                english: 'Hospital',
                color: '#E91E63',
                icon: 'hospital',
                subcategories: [
                    {
                        id: 'not_collecting',
                        bangla: 'ময়লা নিচ্ছে না',
                        english: 'Not collecting waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার খারাপ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত সমস্যা',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'religious',
                bangla: 'ধর্মীয় প্রতিষ্ঠান',
                english: 'Religious Place',
                color: '#00BCD4',
                icon: 'religious',
                subcategories: [
                    {
                        id: 'not_collecting',
                        bangla: 'ময়লা নিচ্ছে না',
                        english: 'Not collecting waste'
                    },
                    {
                        id: 'worker_behavior',
                        bangla: 'ময়লা কর্মীদের ব্যবহার খারাপ',
                        english: 'Poor behavior of waste workers'
                    },
                    {
                        id: 'billing_issue',
                        bangla: 'বিল সংক্রান্ত সমস্যা',
                        english: 'Billing related issue'
                    }
                ]
            },
            {
                id: 'events',
                bangla: 'ইভেন্ট',
                english: 'Events',
                color: '#4CAF50',
                icon: 'events',
                subcategories: [
                    {
                        id: 'event_description',
                        bangla: 'বর্ণনা দিন',
                        english: 'Provide description'
                    }
                ]
            },
            {
                id: 'other',
                bangla: 'অন্যান্য',
                english: 'Other',
                color: '#607D8B',
                icon: 'other',
                subcategories: [
                    {
                        id: 'general',
                        bangla: 'সাধারণ',
                        english: 'General'
                    },
                    {
                        id: 'other_description',
                        bangla: 'বর্ণনা দিন',
                        english: 'Provide description'
                    }
                ]
            }
        ];
    }
    /**
     * Get all categories
     */
    getAllCategories() {
        return this.categories;
    }
    /**
     * Get category by ID
     */
    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId);
    }
    /**
     * Get subcategories for a specific category
     */
    getSubcategories(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.subcategories : [];
    }
    /**
     * Get subcategory by ID within a category
     */
    getSubcategoryById(categoryId, subcategoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category)
            return undefined;
        return category.subcategories.find(sub => sub.id === subcategoryId);
    }
    /**
     * Validate if category and subcategory combination is valid
     */
    validateCategorySubcategory(categoryId, subcategoryId) {
        const subcategory = this.getSubcategoryById(categoryId, subcategoryId);
        return subcategory !== undefined;
    }
    /**
     * Get category name in specified language
     */
    getCategoryName(categoryId, language = 'en') {
        const category = this.getCategoryById(categoryId);
        if (!category)
            return null;
        return language === 'bn' ? category.bangla : category.english;
    }
    /**
     * Get subcategory name in specified language
     */
    getSubcategoryName(categoryId, subcategoryId, language = 'en') {
        const subcategory = this.getSubcategoryById(categoryId, subcategoryId);
        if (!subcategory)
            return null;
        return language === 'bn' ? subcategory.bangla : subcategory.english;
    }
    /**
     * Get category color
     */
    getCategoryColor(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.color : null;
    }
    /**
     * Get total count of categories
     */
    getCategoryCount() {
        return this.categories.length;
    }
    /**
     * Get total count of subcategories
     */
    getSubcategoryCount() {
        return this.categories.reduce((total, cat) => total + cat.subcategories.length, 0);
    }
    /**
     * Check if category exists
     */
    categoryExists(categoryId) {
        return this.getCategoryById(categoryId) !== undefined;
    }
    /**
     * Get all category IDs
     */
    getAllCategoryIds() {
        return this.categories.map(cat => cat.id);
    }
    /**
     * Get all subcategory IDs for a category
     */
    getAllSubcategoryIds(categoryId) {
        const category = this.getCategoryById(categoryId);
        return category ? category.subcategories.map(sub => sub.id) : [];
    }
    /**
     * Get category summary (count of categories and subcategories)
     */
    getCategorySummary() {
        return {
            totalCategories: this.getCategoryCount(),
            totalSubcategories: this.getSubcategoryCount()
        };
    }
}
// Export singleton instance
exports.categoryService = new CategoryService();
