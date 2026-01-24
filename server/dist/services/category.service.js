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
                    },
                    {
                        id: 'home_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'road_environment',
                bangla: 'রাস্তা ও নর্দমা',
                english: 'Road & Drainage',
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
                        id: 'drainage_issue',
                        bangla: 'নর্দমা সমস্যা',
                        english: 'Drainage issue'
                    },
                    {
                        id: 'manhole_issue',
                        bangla: 'ম্যানহোল ঢাকনা নেই',
                        english: 'Missing manhole cover'
                    },
                    {
                        id: 'road_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
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
                    },
                    {
                        id: 'business_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
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
                    },
                    {
                        id: 'office_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
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
                    },
                    {
                        id: 'education_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'hospital',
                bangla: 'হাসপাতাল',
                english: 'Hospital',
                color: '#E74C3C',
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
                    },
                    {
                        id: 'hospital_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'religious',
                bangla: 'ধর্মীয় প্রতিষ্ঠান',
                english: 'Religious Place',
                color: '#F39C12',
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
                    },
                    {
                        id: 'religious_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'events',
                bangla: 'মেলা ও আনন্দোৎসবের সৃষ্টি ময়লা',
                english: 'Events & Celebration Waste',
                color: '#E91E63',
                icon: 'events',
                subcategories: [
                    {
                        id: 'fair_waste',
                        bangla: 'মেলার ময়লা',
                        english: 'Fair waste'
                    },
                    {
                        id: 'celebration_waste',
                        bangla: 'উৎসবের ময়লা',
                        english: 'Celebration waste'
                    },
                    {
                        id: 'event_waste',
                        bangla: 'অনুষ্ঠানের ময়লা',
                        english: 'Event waste'
                    },
                    {
                        id: 'event_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'canal_waterbody',
                bangla: 'খাল ও জলাশয়',
                english: 'Canal & Water Body',
                color: '#00BCD4',
                icon: 'water',
                subcategories: [
                    {
                        id: 'canal_waste',
                        bangla: 'খালে ময়লা জমে আছে',
                        english: 'Waste accumulated in canal'
                    },
                    {
                        id: 'waterbody_waste',
                        bangla: 'জলাশয়ে ময়লা',
                        english: 'Waste in water body'
                    },
                    {
                        id: 'canal_blocked',
                        bangla: 'খাল বন্ধ হয়ে গেছে',
                        english: 'Canal is blocked'
                    },
                    {
                        id: 'water_pollution',
                        bangla: 'পানি দূষণ',
                        english: 'Water pollution'
                    },
                    {
                        id: 'canal_waterbody_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
                    }
                ]
            },
            {
                id: 'drainage_waterlogging',
                bangla: 'নর্দমা ও জলাবদ্ধতা',
                english: 'Drainage & Waterlogging',
                color: '#3F51B5',
                icon: 'drainage',
                subcategories: [
                    {
                        id: 'drainage_blocked',
                        bangla: 'নর্দমা বন্ধ',
                        english: 'Drainage blocked'
                    },
                    {
                        id: 'waterlogging',
                        bangla: 'জলাবদ্ধতা',
                        english: 'Waterlogging'
                    },
                    {
                        id: 'drainage_cover_missing',
                        bangla: 'নর্দমার ঢাকনা নেই',
                        english: 'Missing drainage cover'
                    },
                    {
                        id: 'bad_smell',
                        bangla: 'দুর্গন্ধ',
                        english: 'Bad smell'
                    },
                    {
                        id: 'drainage_waterlogging_others',
                        bangla: 'অন্যান্য',
                        english: 'Others'
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
