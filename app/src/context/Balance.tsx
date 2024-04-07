import React, { ReactNode, createContext, useContext, useState } from 'react';

type BalanceContextType = {
  balance: number;
  setBalance: (balance: number) => void;
};

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

type BalanceProviderProps = {
  children: ReactNode;
};

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);

  return (
    <BalanceContext.Provider value={{ balance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};
