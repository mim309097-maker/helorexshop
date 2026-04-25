# Helorex Shop - Project Instructions & History

এই ফাইলটি AI-এর জন্য প্রজেক্টের প্রেক্ষাপট এবং বিশেষ নিয়মগুলো মনে রাখার জন্য তৈরি করা হয়েছে।

## প্রজেক্টের বর্তমান অবস্থা (Current State)
- **Framework:** React + Vite + Tailwind CSS.
- **Backend:** Firebase (Firestore & Authentication).
- **Authentication:** Google Login এবং Email/Password দুটোই সচল। নতুন ব্যবহারকারী সাইন-ইন করলে তাদের তথ্য অটোমেটিক Firestore-এর `users` কালেকশনে সিঙ্ক হয়।
- **Notifications:** ইন-অ্যাপ (In-app) এবং মোবাইল পুশ নোটিফিকেশন (Browser/Mobile Push) সেটআপ করা হয়েছে। 
    - অর্ডার স্ট্যাটাস আপডেট হলে ইউজারকে নোটিফিকেশন পাঠানো হয়।
    - পুশ নোটিফিকেশনের জন্য `src/services/pushService.ts` ব্যবহার করা হয়েছে।
- **Search Logic:** Firestore থেকে রিয়েল-টাইম ডাটা ফেচ করে ফিল্টারিং করা হয়।

## গুরুত্বপূর্ণ নিয়ম (Strict Rules for AI)
১. **Design Consistency:** সবসময় Brutalist/Modern Aesthetic বজায় রাখতে হবে (High contrast, bold typography, italic accents)।
২. **Identity Integrity:** Firestore সিকিউরিটি রুলস কখনোই ভঙ্গ করা যাবে না। `isValidId()` এবং `isValid[Entity]` হেল্পার সব রাইট অপারেশনে থাকতে হবে।
৩. **UI/UX:** মোবাইল ভিউতে সব মেনু (যেমন: Track Order) এবং বাটনগুলো সহজে অ্যাক্সেসযোগ্য হতে হবে।
৪. **Environment:** API Key বা সিক্রেট ফাইল সরাসরি কোডে লেখা যাবে না, সবসময় `.env.example` এবং এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করতে হবে।

## ভবিষ্যতের ফিচারের পরিকল্পনা (Future Roadmap)
- পেমেন্ট গেটওয়ে ইন্টিগ্রেট করা।
- অ্যাডমিন প্যানেলে আরও উন্নত এনালিটিক্স যোগ করা।
- ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম।

## ব্যবহারকারীর বিশেষ পছন্দ
- ইউজার ইন্টারফেস অনেক বেশি প্রিমিয়াম এবং ইউনিক পছন্দ করেন।
- মোবাইল ইউজারদের জন্য নোটিফিকেশন সিস্টেমটি খুব গুরুত্বপূর্ণ।
