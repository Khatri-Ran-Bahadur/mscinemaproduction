export const metadata = {
  title: "Under Maintenance | MScinemas",
  description: "MScinemas is currently undergoing scheduled maintenance. We will be back online shortly to provide you with the best movie experience.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function MaintenanceLayout({ children }) {
  return <>{children}</>;
}
